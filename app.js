require('dotenv').config();  // 加载 .env 文件
const express   = require('express');
const https     = require('https');
const helmet    = require('helmet');
const winston   = require('winston');
const path      = require('path');
const fs        = require('fs');
const tokenRoutes = require('./routes/tokenRoutes');
// 分别导入 WebSocket 客户端和服务端类
const { WebSocketServer, WebSocket: WebSocketClient } = require('ws');  // WebSocket 库

// 日志目录
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// 配置日志记录器
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'app.log'), level: 'error' }),
    new winston.transports.Console({ format: winston.format.simple(), level: 'info' }),
  ],
});

// 读取 HTTPS 证书和私钥
const privateKey  = fs.readFileSync('naturich.top.key', 'utf8');
const certificate = fs.readFileSync('naturich.top.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// 创建 Express 应用
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));

// 全局 CORS 配置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 解析 JSON 请求体
app.use(express.json());

// 挂载 Token 相关路由（含 xunfeiTranslate）
app.use('/api/token', tokenRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}\nStack: ${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 创建 HTTPS Server 并集成 Express
const PORT = process.env.PORT || 3000;
const server = https.createServer(credentials, app);

// WebSocket 代理：/rtasr → 讯飞 RTASR
// 实例化 WebSocket 服务端（代理服务）
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', (clientWs, req) => {
  // 拼接官方 RTASR 服务地址，保留查询字符串
  const targetUrl = `wss://rtasr.xfyun.cn/v1/ws${req.url}`;
  // 建立到讯飞的 WS 连接，并强制 Origin
const xfWs = new WebSocketClient(targetUrl, {
    headers: { Origin: 'https://rtasr.xfyun.cn' }
  });

  // 双向转发数据
  clientWs.on('message', msg => xfWs.send(msg));
  xfWs.on('message', msg => clientWs.send(msg));

  // 任一端关闭则都关闭
  const cleanup = () => { clientWs.close(); xfWs.close(); };
  clientWs.on('close', cleanup);
  xfWs.on('close', cleanup);
  xfWs.on('error', cleanup);
});

// 拦截 `/rtasr` 的 Upgrade 请求
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/rtasr')) {
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
});

// 启动 HTTPS + WS 服务
server.listen(PORT, () => {
  console.log(`HTTPS & WS proxy running on https://localhost:${PORT}`);
});

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// 捕获未捕获异常
process.on('uncaughtException', err => {
  logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
  process.exit(1);
});

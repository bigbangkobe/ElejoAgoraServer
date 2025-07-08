require('dotenv').config();  // 加载 .env 文件
const express   = require('express');
const https     = require('https');
const helmet    = require('helmet');
const winston   = require('winston');
const path      = require('path');
const fs        = require('fs');
const tokenRoutes = require('./routes/tokenRoutes');
const { WebSocketServer, WebSocket: WebSocketClient } = require('ws');

// 日志目录
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// 日志记录器
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'app.log'), level: 'error' }),
    new winston.transports.Console({ format: winston.format.simple(), level: 'info' }),
  ],
});

// 加载 SSL 证书和私钥
const privateKey  = fs.readFileSync('naturich.top.key', 'utf8');
const certificate = fs.readFileSync('naturich.top.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const PORT = process.env.PORT || 3000;

// 1) 创建 HTTPS Server，不挂载 Express
const server = https.createServer(credentials);

// 2) noServer 模式的 WebSocketServer，只处理升级握手
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', (clientWs, req) => {
  console.log('✔️ 客户端 /rtasr 握手成功，req.url =', req.url);

  // 转发到讯飞 RTASR —— 去掉代理路径 /rtasr，只保留查询参数
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const targetUrl = `wss://rtasr.xfyun.cn/v1/ws${query}`;
  console.log('➡️ 转发到讯飞 RTASR 服务：', targetUrl);

  const xfWs = new WebSocketClient(targetUrl, {
    headers: { Origin: 'https://rtasr.xfyun.cn' }
  });

  // 双向消息转发
  clientWs.on('message', msg => xfWs.send(msg));
  xfWs.on('message', msg => clientWs.send(msg));

  // 任一端关闭时清理
  const cleanup = () => { clientWs.close(); xfWs.close(); };
  clientWs.on('close', cleanup);
  xfWs.on('close', cleanup);
  xfWs.on('error', cleanup);
});

// 3) 在 upgrade 事件中拦截 /rtasr 握手请求
server.on('upgrade', (req, socket, head) => {
  console.log('🔍 [upgrade] req.url =', req.url);
  if (req.url.startsWith('/rtasr')) {
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
});

// 4) 普通 HTTP 请求由 Express 处理
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use('/api/token', tokenRoutes);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}\nStack: ${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 把 Express 挂到 HTTPS Server 的 request 事件
server.on('request', app);

// 5) 启动监听
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS & WS proxy listening on 0.0.0.0:${PORT}`);
});

// 捕获底层 TLS/WS 错误
server.on('clientError', (err, socket) => {
  console.error('🛑 TLS/WS 握手失败：', err.message);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});
process.on('uncaughtException', err => {
  logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
  process.exit(1);
});

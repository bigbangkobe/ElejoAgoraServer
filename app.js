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

// 创建 Express 应用并配置中间件
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

// 创建 HTTPS Server 并挂载 Express
const PORT = process.env.PORT || 3000;
const server = https.createServer(credentials, app);

// 将 WebSocket 绑定到 /rtasr 路径，自动处理 Upgrade
const wss = new WebSocketServer({ server, path: '/rtasr' });

wss.on('connection', (clientWs, req) => {
  console.log('✔️ 客户端 /rtasr 握手成功，req.url =', req.url);
  const targetUrl = `wss://rtasr.xfyun.cn/v1/ws${req.url}`;
  const xfWs = new WebSocketClient(targetUrl, {
    headers: { Origin: 'https://rtasr.xfyun.cn' }
  });

  clientWs.on('message', msg => xfWs.send(msg));
  xfWs.on('message', msg => clientWs.send(msg));

  const cleanup = () => { clientWs.close(); xfWs.close(); };
  clientWs.on('close', cleanup);
  xfWs.on('close', cleanup);
  xfWs.on('error', cleanup);
});

// 启动服务
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS & WS proxy listening on 0.0.0.0:${PORT}`);
});

// 捕获底层错误
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

require('dotenv').config();  // 加载 .env 文件
const express = require('express');
const https = require('https');
const helmet = require('helmet');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const tokenRoutes = require('./routes/tokenRoutes');
const cors = require('cors');


// 日志目录
const logDir = path.join(__dirname, 'logs');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 配置日志记录器
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      level: 'error',
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
      level: 'info',
    }),
  ],
});

// 读取证书和私钥
const privateKey = fs.readFileSync('naturich.top.key', 'utf8');
const certificate = fs.readFileSync('naturich.top.pem', 'utf8');

// 配置 HTTPS 选项
const credentials = { key: privateKey, cert: certificate };

// 创建 Express 应用
const app = express();
app.use(cors({
  origin: 'https://www.elejometa.com',
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
// 对所有预检请求自动返回 204
app.options('*', cors());
// 服务器配置
app.use(helmet({
  contentSecurityPolicy: false, // 禁用内容安全策略，以便设置 CORS
}));

// 设置 CORS 相关的响应头
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 解析 JSON 请求体
app.use(express.json());

// 路由配置
app.use('/api/token', tokenRoutes);

// 捕获 404 错误
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// 捕获其他异常
app.use((err, req, res, next) => {
  // 记录错误日志
  logger.error(`Error: ${err.message}\nStack: ${err.stack}`);
  console.log(`Error: ${err.message}\nStack: ${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 启动 HTTPS 服务器
const PORT = process.env.PORT || 3000;
https.createServer(credentials, app).listen(PORT, () => {
  console.log(`HTTPS Server is running on https://localhost:${PORT}`);
});

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  console.log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// 捕获未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
  console.log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);  // 可选：退出进程，防止应用在崩溃后继续运行
});

require('dotenv').config();  // 加载 .env 文件
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const tokenRoutes = require('./routes/tokenRoutes');
const logger = require('./logger/logger');

// 增强的 CORS 配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : '*', // 开发环境允许所有，生产环境限制来源
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'], // 支持常用方法
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id', 'X-Powered-By'],
  credentials: false, // 如果需要凭证传递设为 true
  maxAge: 86400 // 预检请求缓存时间(秒)
};

// 中间件配置
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // 显式处理 OPTIONS 请求
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 请求日志记录
app.use((req, res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  logger.debug('Headers:', req.headers);
  if (req.method === 'POST' || req.method === 'PUT') {
    logger.debug('Request Body:', req.body);
  }
  next();
});

// 路由配置
app.use('/api/token', tokenRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// 捕获 404 错误
app.use((req, res, next) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  const errorId = Date.now(); // 生成唯一错误ID
  
  logger.error(`[${errorId}] Error: ${err.message}`);
  logger.error(`[${errorId}] Stack: ${err.stack}`);
  logger.error(`[${errorId}] Request: ${req.method} ${req.originalUrl}`);
  
  // 根据错误类型返回不同状态码
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    errorId: errorId,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// 服务器启动
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
});

// 进程异常处理
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // 可以在这里添加通知逻辑
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
  // 优雅关闭
  server.close(() => {
    process.exit(1);
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});
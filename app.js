// app.js
require('dotenv').config();  // 加载 .env 文件
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const tokenRoutes = require('./routes/tokenRoutes');
const logger = require('./logger/logger'); // 引入日志记录器
const helmet = require('helmet');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 服务器配置
// 允许所有跨域请求
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

// 路由配置
app.use('/api/token', tokenRoutes);
// 捕获 404 错误
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use(express.json());  // 确保启用这个中间件，解析请求体中的 JSON 数据
app.use(bodyParser.json());
// 捕获其他异常
app.use((err, req, res, next) => {
  // logger.error(`Error: ${err.message}\nStack: ${err.stack}`);
  console.log(`Error: ${err.message}\nStack: ${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  // logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  console.log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // 上报到邮箱或其他服务
});

// 捕获未捕获的异常
process.on('uncaughtException', (err) => {
  // logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
  console.log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // 上报到邮箱或其他服务
  process.exit(1);  // 可选：退出进程，防止应用在崩溃后继续运行
});

// app.js
require('dotenv').config();  // 加载 .env 文件
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const tokenRoutes = require('./routes/tokenRoutes');
const logger = require('./logger/logger'); // 引入日志记录器

// 服务器配置
app.use(cors({
    origin : '*',  // 或者 '*' 来允许所有源
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));  // 跨域请求
app.use(bodyParser.json());  // 解析 JSON 请求体

// 路由配置
app.use('/api/token', tokenRoutes);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // 上报到邮箱或其他服务
});

// 捕获未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
  // 上报到邮箱或其他服务
  process.exit(1);  // 可选：退出进程，防止应用在崩溃后继续运行
});

// logger.js
const winston = require('winston');
const nodemailer = require('nodemailer');

// 创建邮件发送器
const transporter = nodemailer.createTransport({
  service: 'gmail',  // 你可以根据实际使用的邮箱服务商选择
  auth: {
    user: 'bigbangcpgo@gmail.com',  // 发送邮件的邮箱
    pass: 'Aa910625963',  // 邮箱的授权码或密码
  },
});

// 错误上报邮件函数
const sendErrorEmail = (errorMessage) => {
  const mailOptions = {
    from: 'bigbangcpgo@gmail.com',  // 发送者邮箱
    to: 'chenpengxin@elejometa.com',  // 接收者邮箱
    subject: 'Node.js Application Error',  // 邮件主题
    text: `An error occurred in your Node.js application:\n\n${errorMessage}`,  // 邮件内容
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Error email sent: ' + info.response);
    }
  });
};

// 创建一个日志记录器
const logger = winston.createLogger({
  level: 'info',  // 设置日志等级
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),  // 加入时间戳
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),  // 错误日志
    new winston.transports.File({ filename: 'combined.log' }),  // 综合日志
  ],
});

// 如果不是生产环境，则打印到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// 重写 logger.error 方法，增加邮件发送功能
logger.error = (message) => {
  winston.transports.File.prototype.log.apply(logger, arguments);
  sendErrorEmail(message);  // 发送错误邮件
};

module.exports = logger;

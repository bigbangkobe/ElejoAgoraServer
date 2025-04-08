const agoraService = require('../services/agoraService');

const verifyTokenMiddleware = (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  try {
    const decoded = agoraService.verifyToken(token);
    req.decodedToken = decoded; // 将解码后的令牌存储在请求中
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = verifyTokenMiddleware;

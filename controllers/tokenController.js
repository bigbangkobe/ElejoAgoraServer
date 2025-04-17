const agoraService = require('../services/agoraService');
const zegoService = require('../services/zegoService');

// 从云端获得zego token
const getZegoToken = (req, res) => {
  console.log("Request Body:", req.body);  // 打印请求体，查看其内容
  const { appId, userId, secret, effectiveTimeInSeconds, payload } = req.body;
  console.log("aaaa Request Body:", req.body);  // 打印请求体，查看其内容
  if (!appId || !userId || !secret || !effectiveTimeInSeconds || !payload) {
    console.log("params are is null");  // 打印请求体，查看其内容
    return res.status(400).json({ error: 'params are is null' });
  }

  try {
    const token = zegoService.generateToken04(appId, userId, secret, effectiveTimeInSeconds, payload);
    console.log("token :", token);  // 打印请求体，查看其内容
    return res.status(200).json({ token });
  } catch (err) {
    console.log("Failed to zego generate token:", err);  // 打印请求体，查看其内容
    return res.status(500).json({ error: 'Failed to zego generate token' });
  }
};

// 获取云端生成的 Token
const getToken = (req, res) => {
  const { uid, channelName } = req.body;

  if (!uid || !channelName) {
    return res.status(400).json({ error: 'UID and channelName are required' });
  }

  try {
    const token = agoraService.generateToken(uid, channelName);
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate token' });
  }
};

// 验证云端 Token
const validateToken = (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const decodedToken = agoraService.verifyToken(token);
    return res.status(200).json({ decodedToken });
  } catch (err) {
    return res.status(500).json({ error: 'Token verification failed' });
  }
};

module.exports = {
  getToken,
  validateToken,
  getZegoToken,
};

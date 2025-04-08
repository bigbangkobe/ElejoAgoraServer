const agoraService = require('../services/agoraService');

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
};

const agora = require('agora-access-token');
const { appId, appCertificate, channelExpirationTime } = require('../config/agoraConfig');

// 生成 Agora 令牌
const generateToken = (uid, channelName) => {
  const role = agora.RtcRole.PUBLISHER; // 角色，PUBLISHER 或 SUBSCRIBER

  if (!uid || !channelName) {
    throw new Error('UID and channelName are required');
  }
  console.log("appId:" + appId + ",appCertificate:" + appCertificate);
  // 生成 RTC 令牌
  try {
    const token = agora.RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      Math.floor(Date.now() / 1000) + 3600 // 令牌有效期 1 小时
    );

    return token;
  } catch (err) {
    console.error('Error generating token:', err);
    throw new Error('Failed to generate token');
  }
};

// 验证 Token (这个功能一般通过后台自己验证或者 Agora 认证)
const verifyToken = (token) => {
  // 对令牌进行验证（你可以添加自己的逻辑来验证令牌是否过期）
  try {
    const decoded = agora.RtcTokenBuilder.decodeToken(token);  // 或者使用 Agora 的其他验证方法
    return decoded;
  } catch (err) {
    throw new Error('Token verification failed');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};

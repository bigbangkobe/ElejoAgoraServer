const User = require('../models/User'); // 假设你有一个 User 模型来处理用户数据
const jwt = require('jsonwebtoken'); // 用于生成和验证 JWT 令牌

// 用户注册
const registerUser = async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password, and email are required' });
  }

  try {
    // 检查用户是否已经存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // 创建新用户
    const newUser = new User({
      username,
      password, // 你应该在保存前对密码进行加密处理
      email,
    });

    await newUser.save();
    return res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to register user' });
  }
};

// 用户登录
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 检查密码是否正确（假设你已经对密码进行了加密）
    const isMatch = await user.comparePassword(password); // 需要在 User 模型中实现 `comparePassword` 方法
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // 创建 JWT 令牌
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to login user' });
  }
};

// 获取用户信息
const getUserInfo = async (req, res) => {
  const userId = req.decodedToken.userId; // 从解码的 JWT 令牌中获取用户 ID

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve user info' });
  }
};

// 更新用户信息
const updateUserInfo = async (req, res) => {
  const userId = req.decodedToken.userId;
  const { username, email } = req.body;

  if (!username && !email) {
    return res.status(400).json({ error: 'At least one field to update is required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { username, email },
      { new: true } // 返回更新后的用户数据
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      message: 'User info updated successfully',
      updatedUser: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user info' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserInfo,
  updateUserInfo,
};

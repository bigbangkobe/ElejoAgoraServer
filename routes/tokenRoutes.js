const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

// 获取生成的 Token
router.post('/generate', tokenController.getToken);

router.post('/zegoGenerateToken', tokenController.getZegoToken);

// 验证 Token
router.post('/validate', tokenController.validateToken);

//调用讯飞翻译接口
router.post('/xunfeiTranslate', tokenController.translate);

module.exports = router;

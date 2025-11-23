import { body, validationResult } from 'express-validator';

// 验证结果处理
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('验证错误:', errors.array());
    console.log('请求体:', req.body);
    return res.status(400).json({ 
      success: false, 
      message: '验证失败',
      errors: errors.array(),
      receivedData: req.body
    });
  }
  next();
};

// 注册验证规则
export const registerValidation = [
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号'),
  body('username')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('用户名长度应在2-50个字符之间'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少为6个字符'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('verificationCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('验证码应为6位数字'),
  validate
];

// 登录验证规则
export const loginValidation = [
  body('identifier')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('请输入用户名、手机号或邮箱'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('用户名长度至少为2个字符'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
  validate
];

// 情绪记录验证规则
export const moodValidation = [
  body('mood_type')
    .isIn(['happy', 'sad', 'anxious', 'angry', 'calm', 'excited', 'tired', 'stressed'])
    .withMessage('无效的情绪类型'),
  body('mood_level')
    .isInt({ min: 1, max: 5 })
    .withMessage('情绪等级应在1-5之间'),
  validate
];

// 帖子验证规则
export const postValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('内容长度应在1-5000个字符之间'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('标题长度不能超过200个字符'),
  validate
];

// 评论验证规则
export const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('评论长度应在1-1000个字符之间'),
  validate
];

// 预约验证规则
export const appointmentValidation = [
  body('counselor_id')
    .isUUID()
    .withMessage('咨询师ID无效'),
  body('appointment_date')
    .isDate()
    .withMessage('预约日期格式无效'),
  body('appointment_time')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('预约时间格式无效'),
  validate
];


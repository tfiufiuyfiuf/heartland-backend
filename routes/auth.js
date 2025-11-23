import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase, supabaseAdmin } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { registerValidation, loginValidation } from '../middleware/validator.js';

const router = express.Router();

// 发送验证码（模拟）
router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: '请输入有效的手机号' 
      });
    }

    // TODO: 实际项目中应该调用短信服务API发送验证码
    // 这里模拟生成验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 在实际应用中，应该将验证码存储在Redis中，设置5分钟过期
    // 这里为了演示，返回固定验证码123456
    
    console.log(`验证码已发送到 ${phone}: ${code}`);
    
    res.json({ 
      success: true, 
      message: '验证码已发送',
      // 开发环境返回验证码，生产环境不应返回
      code: process.env.NODE_ENV === 'development' ? '123456' : undefined
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '发送验证码失败，请稍后重试' 
    });
  }
});

// 注册
router.post('/register', registerValidation, async (req, res) => {
  try {
    console.log('注册请求数据:', req.body);
    const { phone, username, password, verificationCode, email, role } = req.body;

    // 如果提供了验证码，则验证（简化处理，实际应该从Redis中验证）
    if (phone && verificationCode && verificationCode !== '123456') {
      return res.status(400).json({ 
        success: false, 
        message: '验证码错误' 
      });
    }

    // 检查用户名是否已注册
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        message: '该用户名已被使用' 
      });
    }

    // 如果提供了手机号，检查是否已注册
    if (phone) {
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single();

      if (existingPhone) {
        return res.status(400).json({ 
          success: false, 
          message: '该手机号已注册' 
        });
      }
    }

    // 如果提供了邮箱，检查是否已注册
    if (email) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: '该邮箱已注册' 
        });
      }
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 随机分配学院
    const houses = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];
    const randomHouse = houses[Math.floor(Math.random() * houses.length)];

    // 确定用户角色（默认为学生）
    const userRole = role || 'student';
    const validRoles = ['student', 'teacher', 'parent', 'admin'];
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的用户角色' 
      });
    }

    // 创建用户（使用admin客户端绕过RLS）
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        phone: phone || null,
        email: email || null,
        username,
        password_hash: passwordHash,
        house: randomHouse,
        role: userRole,
        roles: [userRole]
      })
      .select('id, username, phone, email, role, roles, house, avatar, points, level')
      .single();

    if (error) {
      console.error('创建用户失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '注册失败，请稍后重试' 
      });
    }

    // 创建用户个人资料
    await supabaseAdmin
      .from('user_profiles')
      .insert({ user_id: newUser.id });

    // 生成token
    const token = generateToken(newUser.id);

    res.status(201).json({ 
      success: true, 
      message: '注册成功',
      data: {
        user: newUser,
        token
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '注册失败，请稍后重试' 
    });
  }
});

// 登录
router.post('/login', loginValidation, async (req, res) => {
  try {
    console.log('登录请求数据:', req.body);
    const { username, phone, email, password, identifier } = req.body;

    // 支持使用 identifier 字段（可以是用户名、手机号或邮箱）
    const loginIdentifier = identifier || username || phone || email;

    if (!loginIdentifier) {
      return res.status(400).json({ 
        success: false, 
        message: '请输入用户名、手机号或邮箱' 
      });
    }

    // 尝试多种方式查找用户
    let user = null;
    
    // 1. 先尝试用户名
    const { data: userByUsername } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', loginIdentifier)
      .single();
    
    if (userByUsername) {
      user = userByUsername;
    } else {
      // 2. 尝试手机号
      const { data: userByPhone } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('phone', loginIdentifier)
        .single();
      
      if (userByPhone) {
        user = userByPhone;
      } else {
        // 3. 尝试邮箱
        const { data: userByEmail } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', loginIdentifier)
          .single();
        
        if (userByEmail) {
          user = userByEmail;
        }
      }
    }

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    // 检查账号状态
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        message: '账号已被禁用，请联系管理员' 
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '手机号或密码错误' 
      });
    }

    // 生成token
    const token = generateToken(user.id);

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ 
      success: true, 
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    });
  }
});

// 验证token（检查登录状态）
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '未提供认证令牌' 
      });
    }

    // 验证token并获取用户信息
    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, phone, role, roles, avatar, house, points, level, focus_time, is_active')
      .eq('id', decoded.userId)
      .single();

    if (error || !user || !user.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: '令牌无效' 
      });
    }

    res.json({ 
      success: true, 
      data: { user }
    });
  } catch (error) {
    console.error('验证token失败:', error);
    res.status(401).json({ 
      success: false, 
      message: '令牌无效或已过期' 
    });
  }
});

export default router;


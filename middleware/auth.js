import jwt from 'jsonwebtoken';
import { supabase } from '../config/database.js';

// 验证JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '未提供认证令牌' 
      });
    }

    // 验证token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          success: false, 
          message: '令牌无效或已过期' 
        });
      }

      // 从数据库获取用户信息（使用 maybeSingle 避免查询不到时出错）
      console.log('验证token，userId:', decoded.userId, '类型:', typeof decoded.userId);
      
      // 确保 userId 是字符串格式（Supabase UUID 需要字符串）
      const userId = String(decoded.userId);
      console.log('查询用户，转换后的userId:', userId);
      
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, phone, role, roles, avatar, house, points, level, is_active')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('查询用户失败:', error);
        console.error('查询的userId:', decoded.userId);
        return res.status(500).json({ 
          success: false, 
          message: '服务器错误，请稍后重试',
          debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      if (!user) {
        console.error('用户不存在，userId:', decoded.userId, '类型:', typeof decoded.userId);
        // 尝试查找所有用户看看数据库是否有数据
        const { data: allUsers, error: listError } = await supabase
          .from('users')
          .select('id')
          .limit(5);
        console.log('数据库中的前5个用户ID:', allUsers);
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在',
          debug: process.env.NODE_ENV === 'development' ? `userId: ${decoded.userId}` : undefined
        });
      }
      
      console.log('用户验证成功:', user.username, user.id);

      if (!user.is_active) {
        return res.status(403).json({ 
          success: false, 
          message: '账号已被禁用' 
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '认证失败' 
    });
  }
};

// 检查用户角色
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '未认证' 
      });
    }

    // 检查用户的主角色或多角色列表
    const userRoles = [req.user.role, ...(req.user.roles || [])];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }

    next();
  };
};

// 生成JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};


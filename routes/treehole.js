import express from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 获取树洞消息列表（完全匿名，不需要登录）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('treehole_messages')
      .select('id, content, mood, views_count, replies_count, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('获取树洞消息失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取树洞消息失败' 
      });
    }

    res.json({ 
      success: true, 
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('获取树洞消息异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取树洞消息失败' 
    });
  }
});

// 获取树洞消息详情（包含回复）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取消息
    const { data: message, error: messageError } = await supabase
      .from('treehole_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ 
        success: false, 
        message: '树洞消息不存在' 
      });
    }

    // 增加浏览次数
    await supabaseAdmin
      .from('treehole_messages')
      .update({ views_count: message.views_count + 1 })
      .eq('id', id);

    // 获取回复
    const { data: replies, error: repliesError } = await supabase
      .from('treehole_replies')
      .select('id, content, is_from_counselor, created_at')
      .eq('message_id', id)
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('获取回复失败:', repliesError);
    }

    // 移除用户ID（保护隐私）
    const { user_id, ...messageWithoutUserId } = message;

    res.json({ 
      success: true, 
      data: {
        ...messageWithoutUserId,
        replies: replies || []
      }
    });
  } catch (error) {
    console.error('获取树洞消息详情异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取树洞消息详情失败' 
    });
  }
});

// 发送树洞消息（可选认证）
router.post('/', async (req, res) => {
  try {
    const { content, mood } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '内容不能为空' 
      });
    }

    // 获取用户ID（如果已登录）
    let userId = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // 忽略token验证错误
      }
    }

    // TODO: 添加内容审核和风险评估
    const riskLevel = 'low'; // 简化处理，实际应该通过AI分析

    const { data, error } = await supabaseAdmin
      .from('treehole_messages')
      .insert({
        user_id: userId,
        content,
        mood,
        risk_level: riskLevel
      })
      .select('id, content, mood, views_count, replies_count, created_at')
      .single();

    if (error) {
      console.error('创建树洞消息失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '创建树洞消息失败' 
      });
    }

    res.status(201).json({ 
      success: true, 
      message: '树洞消息已发送',
      data 
    });
  } catch (error) {
    console.error('创建树洞消息异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建树洞消息失败' 
    });
  }
});

// 回复树洞消息（需要认证）
router.post('/:id/replies', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '回复内容不能为空' 
      });
    }

    // 检查是否为咨询师
    const isCounselor = req.user.roles?.includes('counselor') || false;

    const { data, error } = await supabaseAdmin
      .from('treehole_replies')
      .insert({
        message_id: id,
        user_id: req.user.id,
        content,
        is_from_counselor: isCounselor
      })
      .select('id, content, is_from_counselor, created_at')
      .single();

    if (error) {
      console.error('创建回复失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '创建回复失败' 
      });
    }

    // 更新回复数量
    await supabaseAdmin
      .from('treehole_messages')
      .update({ 
        replies_count: supabaseAdmin.sql`replies_count + 1` 
      })
      .eq('id', id);

    res.status(201).json({ 
      success: true, 
      message: '回复成功',
      data 
    });
  } catch (error) {
    console.error('创建回复异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建回复失败' 
    });
  }
});

export default router;


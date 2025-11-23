import express from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, username, phone, email, avatar, role, roles, house, 
        points, level, focus_time, bio, created_at,
        profile:user_profiles(*)
      `)
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('获取用户信息失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取用户信息失败' 
      });
    }

    res.json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('获取用户信息异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户信息失败' 
    });
  }
});

// 更新用户信息
router.put('/me', async (req, res) => {
  try {
    const { username, email, bio, avatar } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('更新用户信息失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '更新用户信息失败' 
      });
    }

    res.json({ 
      success: true, 
      message: '用户信息已更新',
      data 
    });
  } catch (error) {
    console.error('更新用户信息异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新用户信息失败' 
    });
  }
});

// 更新用户个人资料
router.put('/profile', async (req, res) => {
  try {
    const { birthday, gender, school, grade, interests, emergency_contact, emergency_phone } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: req.user.id,
        birthday,
        gender,
        school,
        grade,
        interests,
        emergency_contact,
        emergency_phone
      })
      .select()
      .single();

    if (error) {
      console.error('更新个人资料失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '更新个人资料失败' 
      });
    }

    res.json({ 
      success: true, 
      message: '个人资料已更新',
      data 
    });
  } catch (error) {
    console.error('更新个人资料异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新个人资料失败' 
    });
  }
});

// 获取用户统计数据
router.get('/stats', async (req, res) => {
  try {
    // 获取专注记录统计
    const { data: focusStats } = await supabase
      .from('focus_sessions')
      .select('duration, created_at')
      .eq('user_id', req.user.id)
      .eq('is_completed', true);

    const totalFocusTime = focusStats?.reduce((sum, session) => sum + session.duration, 0) || 0;
    const focusSessionsCount = focusStats?.length || 0;

    // 获取情绪记录统计
    const { count: moodCount } = await supabase
      .from('mood_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    // 获取课程学习统计
    const { data: courseProgress } = await supabase
      .from('user_course_progress')
      .select('is_completed')
      .eq('user_id', req.user.id);

    const completedChapters = courseProgress?.filter(p => p.is_completed).length || 0;

    // 获取社区互动统计
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    res.json({ 
      success: true, 
      data: {
        totalFocusTime: Math.floor(totalFocusTime / 60), // 转换为分钟
        focusSessionsCount,
        moodRecordsCount: moodCount || 0,
        completedChapters,
        postsCount: postsCount || 0,
        commentsCount: commentsCount || 0,
        points: req.user.points,
        level: req.user.level
      }
    });
  } catch (error) {
    console.error('获取用户统计异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取统计数据失败' 
    });
  }
});

// 记录专注时长
router.post('/focus', async (req, res) => {
  try {
    const { duration, task_name, is_completed, interruptions } = req.body;

    if (!duration || duration < 0) {
      return res.status(400).json({ 
        success: false, 
        message: '专注时长无效' 
      });
    }

    // 创建专注记录
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('focus_sessions')
      .insert({
        user_id: req.user.id,
        duration,
        task_name,
        is_completed,
        interruptions
      })
      .select()
      .single();

    if (sessionError) {
      console.error('创建专注记录失败:', sessionError);
      return res.status(500).json({ 
        success: false, 
        message: '记录专注时长失败' 
      });
    }

    // 更新用户总专注时长
    if (is_completed) {
      await supabaseAdmin
        .from('users')
        .update({ 
          focus_time: req.user.focus_time + duration 
        })
        .eq('id', req.user.id);
    }

    res.json({ 
      success: true, 
      message: '专注时长已记录',
      data: session 
    });
  } catch (error) {
    console.error('记录专注时长异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '记录专注时长失败' 
    });
  }
});

// 获取通知列表
router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('获取通知失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取通知失败' 
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
    console.error('获取通知异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取通知失败' 
    });
  }
});

// 标记通知为已读
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('标记通知失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '标记通知失败' 
      });
    }

    res.json({ 
      success: true, 
      message: '通知已标记为已读' 
    });
  } catch (error) {
    console.error('标记通知异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '标记通知失败' 
    });
  }
});

// 标记所有通知为已读
router.put('/notifications/read-all', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) {
      console.error('标记所有通知失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '标记所有通知失败' 
      });
    }

    res.json({ 
      success: true, 
      message: '所有通知已标记为已读' 
    });
  } catch (error) {
    console.error('标记所有通知异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '标记所有通知失败' 
    });
  }
});

export default router;


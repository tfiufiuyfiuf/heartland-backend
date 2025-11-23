import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { moodValidation } from '../middleware/validator.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 创建情绪记录
router.post('/', moodValidation, async (req, res) => {
  try {
    const { mood_type, mood_level, note, tags, weather, location, activities } = req.body;

    const { data, error } = await supabase
      .from('mood_records')
      .insert({
        user_id: req.user.id,
        mood_type,
        mood_level,
        note,
        tags,
        weather,
        location,
        activities
      })
      .select()
      .single();

    if (error) {
      console.error('创建情绪记录失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '创建情绪记录失败' 
      });
    }

    res.status(201).json({ 
      success: true, 
      message: '情绪记录创建成功',
      data 
    });
  } catch (error) {
    console.error('创建情绪记录异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建情绪记录失败' 
    });
  }
});

// 获取用户的情绪记录列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('mood_records')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 日期筛选
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('获取情绪记录失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取情绪记录失败' 
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
    console.error('获取情绪记录异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取情绪记录失败' 
    });
  }
});

// 获取情绪统计数据
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('mood_records')
      .select('mood_type, mood_level, created_at')
      .eq('user_id', req.user.id)
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('获取情绪统计失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取情绪统计失败' 
      });
    }

    // 统计各种情绪的数量
    const moodCounts = {};
    const moodLevels = [];
    
    data.forEach(record => {
      moodCounts[record.mood_type] = (moodCounts[record.mood_type] || 0) + 1;
      moodLevels.push(record.mood_level);
    });

    // 计算平均情绪等级
    const avgMoodLevel = moodLevels.length > 0
      ? (moodLevels.reduce((a, b) => a + b, 0) / moodLevels.length).toFixed(1)
      : 0;

    res.json({ 
      success: true, 
      data: {
        moodCounts,
        avgMoodLevel,
        totalRecords: data.length,
        period: `${days}天`
      }
    });
  } catch (error) {
    console.error('获取情绪统计异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取情绪统计失败' 
    });
  }
});

// 删除情绪记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('mood_records')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('删除情绪记录失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '删除情绪记录失败' 
      });
    }

    res.json({ 
      success: true, 
      message: '情绪记录已删除' 
    });
  } catch (error) {
    console.error('删除情绪记录异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '删除情绪记录失败' 
    });
  }
});

export default router;


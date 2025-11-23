import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 获取所有已发布的课程
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('order_index', { ascending: true })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('获取课程列表失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取课程列表失败' 
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
    console.error('获取课程列表异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取课程列表失败' 
    });
  }
});

// 获取课程详情（包含章节）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取课程基本信息
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ 
        success: false, 
        message: '课程不存在' 
      });
    }

    // 获取课程章节
    const { data: chapters, error: chaptersError } = await supabase
      .from('course_chapters')
      .select('*')
      .eq('course_id', id)
      .order('order_index', { ascending: true });

    if (chaptersError) {
      console.error('获取课程章节失败:', chaptersError);
    }

    // 如果用户已登录，获取学习进度
    let progress = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { data: progressData } = await supabase
          .from('user_course_progress')
          .select('*')
          .eq('user_id', decoded.userId)
          .eq('course_id', id);

        progress = progressData || [];
      } catch (err) {
        // 忽略token验证错误
      }
    }

    res.json({ 
      success: true, 
      data: {
        ...course,
        chapters: chapters || [],
        progress
      }
    });
  } catch (error) {
    console.error('获取课程详情异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取课程详情失败' 
    });
  }
});

// 更新学习进度（需要认证）
router.post('/:courseId/chapters/:chapterId/progress', authenticateToken, async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const { progress_percentage, last_position, is_completed } = req.body;

    const { data, error } = await supabase
      .from('user_course_progress')
      .upsert({
        user_id: req.user.id,
        course_id: courseId,
        chapter_id: chapterId,
        progress_percentage: progress_percentage || 0,
        last_position: last_position || 0,
        is_completed: is_completed || false,
        completed_at: is_completed ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) {
      console.error('更新学习进度失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '更新学习进度失败' 
      });
    }

    res.json({ 
      success: true, 
      message: '学习进度已更新',
      data 
    });
  } catch (error) {
    console.error('更新学习进度异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新学习进度失败' 
    });
  }
});

// 获取用户的学习进度
router.get('/my/progress', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_course_progress')
      .select(`
        *,
        course:courses(*),
        chapter:course_chapters(*)
      `)
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('获取学习进度失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取学习进度失败' 
      });
    }

    res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('获取学习进度异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取学习进度失败' 
    });
  }
});

export default router;


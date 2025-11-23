import express from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { appointmentValidation } from '../middleware/validator.js';

const router = express.Router();

// 获取咨询师列表
router.get('/counselors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('counselors')
      .select('*')
      .eq('is_available', true)
      .order('rating', { ascending: false });

    if (error) {
      console.error('获取咨询师列表失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取咨询师列表失败' 
      });
    }

    res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('获取咨询师列表异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取咨询师列表失败' 
    });
  }
});

// 获取咨询师详情
router.get('/counselors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('counselors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        message: '咨询师不存在' 
      });
    }

    res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('获取咨询师详情异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取咨询师详情失败' 
    });
  }
});

// 创建预约（需要认证）
router.post('/', authenticateToken, appointmentValidation, async (req, res) => {
  try {
    const { counselor_id, appointment_date, appointment_time, duration, topic, note } = req.body;

    // 检查时间冲突
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('id')
      .eq('counselor_id', counselor_id)
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .in('status', ['pending', 'confirmed'])
      .single();

    if (existingAppointment) {
      return res.status(400).json({ 
        success: false, 
        message: '该时间段已被预约' 
      });
    }

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        user_id: req.user.id,
        counselor_id,
        appointment_date,
        appointment_time,
        duration: duration || 50,
        topic,
        note,
        status: 'pending'
      })
      .select(`
        *,
        counselor:counselors(*)
      `)
      .single();

    if (error) {
      console.error('创建预约失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '创建预约失败' 
      });
    }

    // 创建通知
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: req.user.id,
        type: 'appointment',
        title: '预约成功',
        content: `您已成功预约 ${data.counselor.name} 咨询师的心理咨询`,
        link: `/appointments/${data.id}`
      });

    res.status(201).json({ 
      success: true, 
      message: '预约成功',
      data 
    });
  } catch (error) {
    console.error('创建预约异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建预约失败' 
    });
  }
});

// 获取用户的预约列表
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('appointments')
      .select(`
        *,
        counselor:counselors(*)
      `, { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('获取预约列表失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取预约列表失败' 
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
    console.error('获取预约列表异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取预约列表失败' 
    });
  }
});

// 取消预约
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查预约是否存在且属于当前用户
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: '预约不存在' 
      });
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: '该预约无法取消' 
      });
    }

    const { error } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      console.error('取消预约失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '取消预约失败' 
      });
    }

    res.json({ 
      success: true, 
      message: '预约已取消' 
    });
  } catch (error) {
    console.error('取消预约异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '取消预约失败' 
    });
  }
});

export default router;


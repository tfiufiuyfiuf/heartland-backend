import express from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticateToken, checkRole } from '../middleware/auth.js';
import { postValidation, commentValidation } from '../middleware/validator.js';

const router = express.Router();

// 获取帖子列表（已审核的）
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('posts')
      .select(`
        *,
        user:users(id, username, avatar)
      `, { count: 'exact' })
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('获取帖子列表失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '获取帖子列表失败' 
      });
    }

    // 处理匿名帖子
    const processedData = data.map(post => {
      if (post.is_anonymous) {
        return {
          ...post,
          user: { id: null, username: '匿名用户', avatar: '👤' }
        };
      }
      return post;
    });

    res.json({ 
      success: true, 
      data: processedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('获取帖子列表异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取帖子列表失败' 
    });
  }
});

// 获取帖子详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取帖子
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        user:users(id, username, avatar)
      `)
      .eq('id', id)
      .eq('is_approved', true)
      .single();

    if (postError || !post) {
      return res.status(404).json({ 
        success: false, 
        message: '帖子不存在' 
      });
    }

    // 增加浏览次数
    await supabaseAdmin
      .from('posts')
      .update({ views_count: post.views_count + 1 })
      .eq('id', id);

    // 获取评论
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(id, username, avatar)
      `)
      .eq('post_id', id)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('获取评论失败:', commentsError);
    }

    // 处理匿名
    if (post.is_anonymous) {
      post.user = { id: null, username: '匿名用户', avatar: '👤' };
    }

    const processedComments = (comments || []).map(comment => {
      if (comment.is_anonymous) {
        return {
          ...comment,
          user: { id: null, username: '匿名用户', avatar: '👤' }
        };
      }
      return comment;
    });

    res.json({ 
      success: true, 
      data: {
        ...post,
        comments: processedComments
      }
    });
  } catch (error) {
    console.error('获取帖子详情异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取帖子详情失败' 
    });
  }
});

// 创建帖子（需要认证）
router.post('/', authenticateToken, postValidation, async (req, res) => {
  try {
    const { title, content, category, tags, images, is_anonymous } = req.body;

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: req.user.id,
        title,
        content,
        category,
        tags,
        images,
        is_anonymous: is_anonymous || false,
        is_approved: true // 默认自动审核通过，实际应用可能需要人工审核
      })
      .select()
      .single();

    if (error) {
      console.error('创建帖子失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '创建帖子失败' 
      });
    }

    res.status(201).json({ 
      success: true, 
      message: '帖子创建成功',
      data 
    });
  } catch (error) {
    console.error('创建帖子异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建帖子失败' 
    });
  }
});

// 评论帖子（需要认证）
router.post('/:id/comments', authenticateToken, commentValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id, is_anonymous } = req.body;

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id: id,
        user_id: req.user.id,
        parent_id,
        content,
        is_anonymous: is_anonymous || false
      })
      .select()
      .single();

    if (error) {
      console.error('创建评论失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '创建评论失败' 
      });
    }

    // 更新帖子评论数
    await supabaseAdmin.rpc('increment_post_comments', { post_id: id });

    res.status(201).json({ 
      success: true, 
      message: '评论成功',
      data 
    });
  } catch (error) {
    console.error('创建评论异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建评论失败' 
    });
  }
});

// 点赞/取消点赞
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否已点赞
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('target_type', 'post')
      .eq('target_id', id)
      .single();

    if (existingLike) {
      // 取消点赞
      await supabaseAdmin
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      await supabaseAdmin.rpc('decrement_post_likes', { post_id: id });

      res.json({ 
        success: true, 
        message: '已取消点赞',
        liked: false 
      });
    } else {
      // 点赞
      await supabaseAdmin
        .from('likes')
        .insert({
          user_id: req.user.id,
          target_type: 'post',
          target_id: id
        });

      await supabaseAdmin.rpc('increment_post_likes', { post_id: id });

      res.json({ 
        success: true, 
        message: '点赞成功',
        liked: true 
      });
    }
  } catch (error) {
    console.error('点赞操作异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '操作失败' 
    });
  }
});

// 删除帖子（作者或管理员）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查权限
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: '帖子不存在' 
      });
    }

    const isAuthor = post.user_id === req.user.id;
    const isAdmin = req.user.roles.includes('admin');

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: '无权删除此帖子' 
      });
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除帖子失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: '删除帖子失败' 
      });
    }

    res.json({ 
      success: true, 
      message: '帖子已删除' 
    });
  } catch (error) {
    console.error('删除帖子异常:', error);
    res.status(500).json({ 
      success: false, 
      message: '删除帖子失败' 
    });
  }
});

export default router;


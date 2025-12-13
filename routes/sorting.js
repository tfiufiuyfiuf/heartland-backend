import express from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 获取分院测试题目（可选认证：如果有token则检查是否已完成，没有token也可以获取题目）
router.get('/questions', async (req, res) => {
  try {
    // 尝试获取用户信息（如果有token）
    let user = null;
    if (req.headers.authorization) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { data } = await supabase
          .from('users')
          .select('id, sorting_completed, house')
          .eq('id', decoded.userId)
          .single();
        user = data;
      } catch (error) {
        // token无效或过期，忽略，继续获取题目
        console.log('Token验证失败，继续获取题目:', error.message);
      }
    }

    // 如果用户已完成分院测试，返回提示
    if (user && user.sorting_completed) {
      return res.json({
        success: false,
        message: '您已完成分院测试',
        data: { house: user.house }
      });
    }

    if (user && user.sorting_completed) {
      return res.json({
        success: false,
        message: '您已完成分院测试',
        data: { house: user.house }
      });
    }

    // 获取所有活跃题目（限制15道）
    const { data: questions, error } = await supabase
      .from('sorting_questions')
      .select('id, question, options, category, order_index')
      .eq('is_active', true)
      .order('order_index')
      .limit(15); // 确保只返回15道题

    if (error) {
      throw error;
    }

    // 打乱选项顺序（保持题目顺序），并为每个选项创建唯一标识
    const questionsWithShuffledOptions = questions.map(q => {
      // 为每个选项创建唯一标识（基于原始索引和文本的hash）
      const options = q.options.map((opt, idx) => {
        // 创建一个简单的hash作为唯一标识（基于题目ID和原始索引）
        const uniqueId = Buffer.from(`${q.id}-${idx}-${opt.text}`).toString('base64').substring(0, 16);
        return {
          id: uniqueId, // 唯一标识符
          text: opt.text,
          originalIndex: idx // 保留原始索引用于后端匹配
        };
      });
      
      // Fisher-Yates 洗牌算法打乱顺序
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      // 移除originalIndex，不暴露给前端（只保留id和text）
      const publicOptions = options.map(({ id, text }) => ({ id, text }));

      return {
        id: q.id,
        question: q.question,
        options: publicOptions,
        category: q.category
      };
    });

    res.json({
      success: true,
      data: {
        questions: questionsWithShuffledOptions,
        total: questions.length
      }
    });
  } catch (error) {
    console.error('获取分院测试题目失败:', error);
    res.status(500).json({
      success: false,
      message: '获取题目失败，请稍后重试'
    });
  }
});

// 提交分院测试答案
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    console.log('收到分院测试提交请求:', req.body);
    console.log('请求用户信息:', req.user);
    const { answers, duration } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      console.error('用户ID不存在，req.user:', req.user);
      return res.status(401).json({
        success: false,
        message: '用户认证失败，请重新登录'
      });
    }
    
    console.log('用户ID:', userId, '类型:', typeof userId);

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: '答案格式错误'
      });
    }

    // 检查用户是否已完成分院测试
    const { data: user } = await supabase
      .from('users')
      .select('sorting_completed')
      .eq('id', userId)
      .single();

    if (user && user.sorting_completed) {
      return res.status(400).json({
        success: false,
        message: '您已完成分院测试'
      });
    }

    // 获取所有题目及其选项
    const { data: questions, error: questionsError } = await supabase
      .from('sorting_questions')
      .select('id, options')
      .eq('is_active', true);

    if (questionsError) {
      throw questionsError;
    }

    // 计算各学院得分
    const scores = {
      gryffindor: 0,
      slytherin: 0,
      ravenclaw: 0,
      hufflepuff: 0
    };

    const questionMap = new Map(questions.map(q => [q.id, q]));

    // 处理每个答案
    answers.forEach(answer => {
      const question = questionMap.get(answer.questionId);
      if (!question) return;

      // 如果使用的是旧的optionId（数字索引），直接使用
      if (typeof answer.optionId === 'number') {
        const option = question.options[answer.optionId];
        if (option) {
          scores[option.house] += option.score;
        }
        return;
      }

      // 如果使用的是新的唯一ID（字符串），需要匹配
      // 重新生成唯一ID来匹配（使用相同的生成规则）
      for (let idx = 0; idx < question.options.length; idx++) {
        const opt = question.options[idx];
        const uniqueId = Buffer.from(`${answer.questionId}-${idx}-${opt.text}`).toString('base64').substring(0, 16);
        if (uniqueId === answer.optionId) {
          scores[opt.house] += opt.score;
          break;
        }
      }
    });

    // 找出最高分学院
    const maxScore = Math.max(...Object.values(scores));
    const topHouses = Object.keys(scores).filter(h => scores[h] === maxScore);
    
    // 如果有多个学院分数相同，随机选择一个
    const finalHouse = topHouses[Math.floor(Math.random() * topHouses.length)];

    // 保存测试记录
    const { error: historyError } = await supabaseAdmin
      .from('user_sorting_history')
      .insert({
        user_id: userId,
        answers,
        scores,
        final_house: finalHouse,
        test_duration: duration || null
      });

    if (historyError) {
      throw historyError;
    }

    // 更新用户学院和测试完成状态
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        house: finalHouse,
        sorting_completed: true
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // 学院信息
    const houseInfo = {
      gryffindor: {
        name: '格兰芬多',
        emoji: '🦁',
        color: '#740001',
        traits: ['勇敢', '勇气', '骑士精神'],
        description: '格兰芬多代表勇气、勇敢和骑士精神。这里汇聚了最勇敢的心灵！'
      },
      slytherin: {
        name: '斯莱特林',
        emoji: '🐍',
        color: '#1A472A',
        traits: ['野心', '精明', '领导力'],
        description: '斯莱特林代表野心、精明和领导力。这里培养真正的领袖！'
      },
      ravenclaw: {
        name: '拉文克劳',
        emoji: '🦅',
        color: '#0E1A40',
        traits: ['智慧', '创造力', '学识'],
        description: '拉文克劳代表智慧、创造力和学识。这里欢迎最聪慧的头脑！'
      },
      hufflepuff: {
        name: '赫奇帕奇',
        emoji: '🦡',
        color: '#FFDB00',
        traits: ['忠诚', '勤劳', '正直'],
        description: '赫奇帕奇代表忠诚、勤劳和正直。这里珍视真诚与努力！'
      }
    };

    res.json({
      success: true,
      message: `恭喜！分院帽将你分配到了${houseInfo[finalHouse].name}！`,
      data: {
        house: finalHouse,
        houseInfo: houseInfo[finalHouse],
        scores
      }
    });
  } catch (error) {
    console.error('提交分院测试失败:', error);
    res.status(500).json({
      success: false,
      message: '提交失败，请稍后重试'
    });
  }
});

// 获取用户分院测试历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_sorting_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: { history: data }
    });
  } catch (error) {
    console.error('获取分院历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取历史记录失败'
    });
  }
});

export default router;



import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// AI 配置（预留接口）
const AI_CONFIG = {
  // 学习助教配置
  learning: {
    model: 'qwen-plus', // 通义千问 / wenxin / doubao
    systemPrompt: `你是一个专业的学习助教，负责帮助学生解答各科学习问题。
你应该：
1. 用简单易懂的语言解释概念
2. 提供具体的例子和步骤
3. 鼓励学生独立思考
4. 保持耐心和友好的态度
5. 如果学生提问与学习无关，礼貌地引导回学习话题`
  },
  
  // 心理助教配置
  psychology: {
    model: 'qwen-plus',
    systemPrompt: `你是一个专业的心理健康助教，专注于青少年心理健康领域。
你应该：
1. 倾听并理解学生的情绪和困扰
2. 提供专业但易懂的心理学建议
3. 保持同理心和关怀
4. 识别可能的心理危机信号
5. 仅回答心理健康相关问题
6. 如遇严重心理问题，建议寻求专业心理咨询师帮助
7. 必要时联网搜索最新的心理学研究和资讯`,
    allowSearch: true // 允许联网搜索
  }
};

// 学习助教对话
router.post('/chat/learning', authenticateToken, async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: '请输入问题'
      });
    }

    // TODO: 接入国内 AI 模型
    // 这里预留接口，实际部署时需要：
    // 1. 申请通义千问/文心一言/豆包 API
    // 2. 配置 API Key
    // 3. 调用对应的 SDK
    
    // 示例响应（实际应该调用 AI API）
    const aiResponse = {
      success: true,
      data: {
        reply: '这是学习助教的回复（演示版本）。实际部署时会接入真实的AI模型，如通义千问、文心一言或豆包。',
        conversationId: Date.now().toString(),
        timestamp: new Date().toISOString()
      }
    };

    // 记录对话（可选）
    // await saveConversation(req.user.id, 'learning', message, aiResponse.data.reply);

    res.json(aiResponse);
  } catch (error) {
    console.error('学习助教对话失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI 助教暂时无法回复，请稍后重试'
    });
  }
});

// 心理助教对话
router.post('/chat/psychology', authenticateToken, async (req, res) => {
  try {
    const { message, conversationHistory, needSearch } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: '请输入问题'
      });
    }

    // 检查是否仅心理相关问题
    const psychologyKeywords = ['心理', '情绪', '压力', '焦虑', '抑郁', '烦恼', '困扰', '心情', '感受'];
    const isRelevant = psychologyKeywords.some(keyword => message.includes(keyword));
    
    if (!isRelevant) {
      return res.json({
        success: true,
        data: {
          reply: '很抱歉，我是专门的心理健康助教，只能回答心理相关的问题。如果你有学习上的问题，可以咨询学习助教哦~',
          conversationId: Date.now().toString(),
          timestamp: new Date().toISOString()
        }
      });
    }

    // TODO: 接入国内 AI 模型 + 搜索增强
    // 实际部署时需要：
    // 1. 接入 AI 模型 API
    // 2. 如果 needSearch 为 true，先调用搜索 API
    // 3. 将搜索结果作为上下文提供给 AI
    // 4. 返回 AI 生成的回复
    
    let searchResults = [];
    if (needSearch && AI_CONFIG.psychology.allowSearch) {
      // TODO: 调用搜索 API（如百度搜索、必应搜索）
      // searchResults = await searchPsychology(message);
    }

    // 示例响应
    const aiResponse = {
      success: true,
      data: {
        reply: '这是心理助教的回复（演示版本）。实际部署时会接入真实的AI模型，并支持联网搜索心理学相关资讯。',
        conversationId: Date.now().toString(),
        timestamp: new Date().toISOString(),
        sources: searchResults.length > 0 ? searchResults : null
      }
    };

    res.json(aiResponse);
  } catch (error) {
    console.error('心理助教对话失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI 助教暂时无法回复，请稍后重试'
    });
  }
});

// 获取对话历史
router.get('/history/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params; // learning 或 psychology
    
    // TODO: 从数据库获取对话历史
    // const history = await getConversationHistory(req.user.id, type);
    
    res.json({
      success: true,
      data: {
        history: []
      }
    });
  } catch (error) {
    console.error('获取对话历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取历史记录失败'
    });
  }
});

// 清空对话历史
router.delete('/history/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    // TODO: 清空数据库中的对话历史
    // await clearConversationHistory(req.user.id, type);
    
    res.json({
      success: true,
      message: '对话历史已清空'
    });
  } catch (error) {
    console.error('清空对话历史失败:', error);
    res.status(500).json({
      success: false,
      message: '清空历史记录失败'
    });
  }
});

export default router;

/*
 * AI 接入指南：
 * 
 * 1. 通义千问（阿里云）
 *    - 文档：https://help.aliyun.com/zh/dashscope/
 *    - SDK: npm install @alicloud/dashscope-sdk
 * 
 * 2. 文心一言（百度）
 *    - 文档：https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html
 *    - SDK: npm install @baiducloud/qianfan
 * 
 * 3. 豆包（字节跳动）
 *    - 文档：https://www.volcengine.com/docs/82379
 *    - SDK: 参考官方文档
 * 
 * 搜索 API 推荐：
 *    - 必应搜索 API
 *    - 百度搜索 API
 *    - Google Search API（需要翻墙）
 */



-- 重置分院测试题目为15道
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 删除所有旧题目
DELETE FROM sorting_questions;

-- 2. 重置序列（如果需要）
-- ALTER SEQUENCE sorting_questions_id_seq RESTART WITH 1;

-- 3. 插入15道新题目

-- 价值观题目（5题）
INSERT INTO sorting_questions (question, options, category, difficulty, order_index) VALUES
(
  '在团队项目中遇到分歧时，你倾向于：',
  '[
    {"text": "坚持自己认为正确的方向，勇敢表达观点", "house": "gryffindor", "score": 3},
    {"text": "分析各方意见的利弊，寻找最优解", "house": "ravenclaw", "score": 3},
    {"text": "尊重多数人的意见，维护团队和谐", "house": "hufflepuff", "score": 3},
    {"text": "评估哪种方案对自己最有利，再做决定", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'values',
  2,
  1
),
(
  '如果你发现好朋友在考试中作弊，你会：',
  '[
    {"text": "立即制止并报告老师，维护公平正义", "house": "gryffindor", "score": 3},
    {"text": "私下严肃地与朋友沟通，帮助其认识错误", "house": "hufflepuff", "score": 3},
    {"text": "分析作弊的原因和后果，理性劝导", "house": "ravenclaw", "score": 3},
    {"text": "根据情况判断，考虑是否值得破坏友谊", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'values',
  3,
  2
),
(
  '面对一个困难但有意义的挑战，你的态度是：',
  '[
    {"text": "毫不犹豫接受，享受挑战带来的刺激", "house": "gryffindor", "score": 3},
    {"text": "仔细研究挑战的内容，制定详细计划", "house": "ravenclaw", "score": 3},
    {"text": "评估挑战的风险和收益，谨慎决策", "house": "slytherin", "score": 3},
    {"text": "考虑自己能否胜任，不轻易放弃", "house": "hufflepuff", "score": 3}
  ]'::jsonb,
  'values',
  2,
  3
),
(
  '在追求目标的过程中，你更看重：',
  '[
    {"text": "勇敢行动，永不放弃的勇气", "house": "gryffindor", "score": 3},
    {"text": "智慧策略，找到最佳路径", "house": "ravenclaw", "score": 3},
    {"text": "坚持努力，踏实前进", "house": "hufflepuff", "score": 3},
    {"text": "灵活变通，达成目标的结果", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'values',
  2,
  4
),
(
  '如果有机会获得一项特殊能力，你希望是：',
  '[
    {"text": "超凡的勇气，面对任何危险都无所畏惧", "house": "gryffindor", "score": 3},
    {"text": "过目不忘的记忆力和洞察力", "house": "ravenclaw", "score": 3},
    {"text": "感知他人情绪并给予安慰的能力", "house": "hufflepuff", "score": 3},
    {"text": "精准判断局势并抓住机会的能力", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'values',
  2,
  5
),
(
  '在野外迷路时，你会：',
  '[
    {"text": "凭直觉选择一个方向，勇敢前进", "house": "gryffindor", "score": 3},
    {"text": "观察太阳、星星等自然现象，推理方向", "house": "ravenclaw", "score": 3},
    {"text": "原地等待救援，保存体力", "house": "hufflepuff", "score": 3},
    {"text": "寻找制高点，评估各方向的利弊", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'scenario',
  3,
  6
),
(
  '发现一个同学被孤立，你会：',
  '[
    {"text": "主动站出来和他做朋友，不管他人看法", "house": "gryffindor", "score": 3},
    {"text": "了解事情原因，理性判断是否应该帮助", "house": "ravenclaw", "score": 3},
    {"text": "给予关心和陪伴，让他感受到温暖", "house": "hufflepuff", "score": 3},
    {"text": "先观察情况，避免自己也被孤立", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'scenario',
  2,
  7
),
(
  '在紧急情况下需要做决定时，你倾向于：',
  '[
    {"text": "凭直觉快速行动，相信第一感觉", "house": "gryffindor", "score": 3},
    {"text": "快速分析利弊，做出理性判断", "house": "ravenclaw", "score": 3},
    {"text": "征求他人意见，综合考虑", "house": "hufflepuff", "score": 3},
    {"text": "评估各种选择对自己的影响", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'scenario',
  2,
  8
),
(
  '参加比赛时落后对手，你会：',
  '[
    {"text": "激发斗志，全力以赴拼到最后", "house": "gryffindor", "score": 3},
    {"text": "分析对手弱点，调整战术", "house": "ravenclaw", "score": 3},
    {"text": "保持稳定节奏，坚持到底", "house": "hufflepuff", "score": 3},
    {"text": "寻找规则内的一切可行方法反超", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'scenario',
  2,
  9
),
(
  '发现一个有价值的秘密，你会：',
  '[
    {"text": "如果是正义的事，立即公开揭露", "house": "gryffindor", "score": 3},
    {"text": "仔细研究秘密的真相和影响", "house": "ravenclaw", "score": 3},
    {"text": "为他人保守秘密，值得信赖", "house": "hufflepuff", "score": 3},
    {"text": "评估秘密的价值，谨慎使用", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'scenario',
  3,
  10
),
(
  '在学习新知识时，你更喜欢：',
  '[
    {"text": "直接动手实践，在行动中学习", "house": "gryffindor", "score": 3},
    {"text": "深入研究原理，透彻理解本质", "house": "ravenclaw", "score": 3},
    {"text": "按部就班学习，打好基础", "house": "hufflepuff", "score": 3},
    {"text": "找到最高效的学习方法", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'personality',
  2,
  11
),
(
  '朋友向你倾诉烦恼时，你通常：',
  '[
    {"text": "鼓励他勇敢面对，提供行动建议", "house": "gryffindor", "score": 3},
    {"text": "帮助分析问题根源，提供解决思路", "house": "ravenclaw", "score": 3},
    {"text": "耐心倾听，给予情感支持和安慰", "house": "hufflepuff", "score": 3},
    {"text": "根据实际情况，给出最实用的建议", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'personality',
  2,
  12
),
(
  '面对失败时，你的第一反应是：',
  '[
    {"text": "不服输，立即计划再次挑战", "house": "gryffindor", "score": 3},
    {"text": "分析失败原因，总结经验教训", "house": "ravenclaw", "score": 3},
    {"text": "接受失败，继续努力前进", "house": "hufflepuff", "score": 3},
    {"text": "调整策略，换个方式尝试", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'personality',
  2,
  13
),
(
  '在团队中，你更愿意扮演的角色是：',
  '[
    {"text": "领导者，带领团队前进", "house": "gryffindor", "score": 3},
    {"text": "智囊，提供策略和建议", "house": "ravenclaw", "score": 3},
    {"text": "协调者，维护团队和谐", "house": "hufflepuff", "score": 3},
    {"text": "执行者，确保目标达成", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'personality',
  2,
  14
),
(
  '你认为最重要的品质是：',
  '[
    {"text": "勇气和正直", "house": "gryffindor", "score": 3},
    {"text": "智慧和创造力", "house": "ravenclaw", "score": 3},
    {"text": "忠诚和善良", "house": "hufflepuff", "score": 3},
    {"text": "野心和决断力", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'personality',
  2,
  15
);

-- 验证：应该只有15道题
SELECT COUNT(*) as total_questions FROM sorting_questions WHERE is_active = true;


-- 重置分院测试题目为15道（防作弊版本）
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 删除所有旧题目
DELETE FROM sorting_questions;

-- 2. 插入15道更难、更模糊的新题目（选项更难预测）

-- 心理测试题（5题）- 更模糊，需要深度思考
INSERT INTO sorting_questions (question, options, category, difficulty, order_index) VALUES
(
  '深夜独自在图书馆学习时，你更倾向于选择：',
  '[
    {"text": "角落的位置，安静不受打扰", "house": "ravenclaw", "score": 3},
    {"text": "靠近窗户的位置，可以看到外面的风景", "house": "hufflepuff", "score": 3},
    {"text": "靠近出口的位置，方便随时离开", "house": "slytherin", "score": 3},
    {"text": "大厅中央的位置，方便观察周围", "house": "gryffindor", "score": 3}
  ]'::jsonb,
  'values',
  3,
  1
),
(
  '收到一个匿名包裹，你会：',
  '[
    {"text": "仔细检查包装和标签，分析可能的来源", "house": "ravenclaw", "score": 3},
    {"text": "毫不犹豫地打开，相信不会是危险物品", "house": "gryffindor", "score": 3},
    {"text": "先询问周围的人是否有印象，再做决定", "house": "hufflepuff", "score": 3},
    {"text": "评估风险和可能的收益，谨慎处理", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'values',
  4,
  2
),
(
  '在完成一个困难的项目后，你最想：',
  '[
    {"text": "立即开始下一个更有挑战性的项目", "house": "gryffindor", "score": 3},
    {"text": "深入分析这次的经验，总结可改进的地方", "house": "ravenclaw", "score": 3},
    {"text": "休息一下，感谢帮助过自己的伙伴", "house": "hufflepuff", "score": 3},
    {"text": "评估这个项目带来的实际价值", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'values',
  3,
  3
),
(
  '参加一个完全陌生的聚会时，你会：',
  '[
    {"text": "主动认识新朋友，积极参与互动", "house": "gryffindor", "score": 3},
    {"text": "先观察环境和人群，了解情况再行动", "house": "ravenclaw", "score": 3},
    {"text": "寻找看起来需要帮助的人，给予关心", "house": "hufflepuff", "score": 3},
    {"text": "评估聚会对自己的价值，决定参与程度", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'values',
  3,
  4
),
(
  '面对一个需要长期坚持的目标，你认为最重要的是：',
  '[
    {"text": "坚定的信念和不屈的意志", "house": "gryffindor", "score": 3},
    {"text": "清晰的规划和持续的自我反思", "house": "ravenclaw", "score": 3},
    {"text": "周围人的支持和鼓励", "house": "hufflepuff", "score": 3},
    {"text": "明确的目标价值和阶段性的奖励", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'values',
  3,
  5
),
(
  '如果必须选择一种生活方式，你会选择：',
  '[
    {"text": "充满冒险和未知的生活", "house": "gryffindor", "score": 3},
    {"text": "不断学习和探索的生活", "house": "ravenclaw", "score": 3},
    {"text": "安稳和谐的生活", "house": "hufflepuff", "score": 3},
    {"text": "追求成功和影响力的生活", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'scenario',
  4,
  6
),
(
  '在处理复杂的人际关系问题时，你更倾向于：',
  '[
    {"text": "直接沟通，开诚布公地解决问题", "house": "gryffindor", "score": 3},
    {"text": "分析问题的根源和各方立场", "house": "ravenclaw", "score": 3},
    {"text": "耐心倾听，寻求双方都能接受的方案", "house": "hufflepuff", "score": 3},
    {"text": "权衡各方利益，找到最优解", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'scenario',
  3,
  7
),
(
  '在压力很大的情况下，你的反应是：',
  '[
    {"text": "将压力转化为动力，更加专注", "house": "gryffindor", "score": 3},
    {"text": "分析压力的来源，制定应对策略", "house": "ravenclaw", "score": 3},
    {"text": "寻求支持，与他人分担压力", "house": "hufflepuff", "score": 3},
    {"text": "重新评估目标，必要时调整方向", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'scenario',
  3,
  8
),
(
  '面对一个看似不可能完成的任务，你会：',
  '[
    {"text": "毫不犹豫接受，相信只要努力就能完成", "house": "gryffindor", "score": 3},
    {"text": "深入分析任务，寻找可能的突破口", "house": "ravenclaw", "score": 3},
    {"text": "寻求帮助，相信团队的力量", "house": "hufflepuff", "score": 3},
    {"text": "评估任务的实际可行性，决定是否值得投入", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'scenario',
  3,
  9
),
(
  '在团队中有人犯错时，你认为最好的处理方式是：',
  '[
    {"text": "立即指出错误，帮助改正", "house": "gryffindor", "score": 3},
    {"text": "分析错误原因，防止再次发生", "house": "ravenclaw", "score": 3},
    {"text": "给予理解和支持，共同解决问题", "house": "hufflepuff", "score": 3},
    {"text": "评估错误影响，决定处理方式", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'scenario',
  3,
  10
),
(
  '你认为理想的学习环境是：',
  '[
    {"text": "充满挑战和竞争的环境", "house": "gryffindor", "score": 3},
    {"text": "安静且有丰富资源的环境", "house": "ravenclaw", "score": 3},
    {"text": "友好互助的环境", "house": "hufflepuff", "score": 3},
    {"text": "注重实际应用和成果的环境", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'personality',
  3,
  11
),
(
  '在做重要决定时，你主要依赖：',
  '[
    {"text": "内心的直觉和勇气", "house": "gryffindor", "score": 3},
    {"text": "充分的思考和理性分析", "house": "ravenclaw", "score": 3},
    {"text": "他人的建议和自己的价值观", "house": "hufflepuff", "score": 3},
    {"text": "对结果的预测和利弊权衡", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'personality',
  3,
  12
),
(
  '你更愿意被人记住为：',
  '[
    {"text": "勇敢无畏的人", "house": "gryffindor", "score": 3},
    {"text": "智慧博学的人", "house": "ravenclaw", "score": 3},
    {"text": "善良可靠的人", "house": "hufflepuff", "score": 3},
    {"text": "成功卓越的人", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'personality',
  4,
  13
),
(
  '面对不确定的未来，你的态度是：',
  '[
    {"text": "充满期待，迎接任何挑战", "house": "gryffindor", "score": 3},
    {"text": "积极准备，尽量掌握更多信息", "house": "ravenclaw", "score": 3},
    {"text": "保持乐观，相信一切会好起来", "house": "hufflepuff", "score": 3},
    {"text": "制定计划，控制可控的因素", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'personality',
  3,
  14
),
(
  '你认为人与人之间最重要的是：',
  '[
    {"text": "真诚和信任", "house": "gryffindor", "score": 3},
    {"text": "理解和尊重", "house": "ravenclaw", "score": 3},
    {"text": "关爱和支持", "house": "hufflepuff", "score": 3},
    {"text": "互利和共赢", "house": "slytherin", "score": 3}
  ]'::jsonb,
  'personality',
  4,
  15
);

-- 验证：应该只有15道题
SELECT COUNT(*) as total_questions FROM sorting_questions WHERE is_active = true;


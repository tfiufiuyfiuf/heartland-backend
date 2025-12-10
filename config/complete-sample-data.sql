-- 心屿学院 - 完整示例数据
-- 请在 Supabase SQL Editor 中执行此脚本

-- ============================================
-- 1. 添加课程
-- ============================================

INSERT INTO courses (title, description, category, difficulty, duration, cover_image, instructor, is_published, order_index) VALUES
('情绪识别与管理', '学习如何识别自己的情绪，掌握有效的情绪管理技巧。通过科学的方法，帮助你更好地理解和调节情绪。', 'emotion', 'beginner', 45, 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800', '李心理老师', true, 1),
('压力应对与放松', '了解压力的来源，学习科学的压力缓解方法。包括呼吸练习、正念冥想等实用技巧。', 'stress', 'beginner', 50, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', '王心理老师', true, 2),
('人际关系处理', '建立健康的人际关系，学会有效沟通。掌握倾听技巧和表达方法，改善人际互动。', 'relationship', 'intermediate', 60, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', '张老师', true, 3),
('自我认知与成长', '探索自我，发现潜能，建立自信。通过自我觉察和反思，促进个人成长。', 'growth', 'beginner', 40, 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', '刘老师', true, 4),
('焦虑情绪调节', '认识焦虑，学习应对焦虑的实用技巧。包括认知重构、放松训练等方法。', 'emotion', 'intermediate', 55, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', '李心理老师', true, 5),
('学习压力管理', '应对学习压力，提高学习效率。学习时间管理和目标设定技巧。', 'stress', 'beginner', 45, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', '王老师', true, 6),
('青春期心理适应', '理解青春期的身心变化，学会积极适应。建立健康的自我认同。', 'growth', 'beginner', 50, 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800', '陈老师', true, 7),
('情绪ABC理论', '学习情绪ABC理论，理解想法如何影响情绪。掌握改变不合理信念的方法。', 'emotion', 'advanced', 60, 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800', '李心理老师', true, 8);

-- ============================================
-- 2. 添加课程章节
-- ============================================

-- 情绪识别与管理的章节
INSERT INTO course_chapters (course_id, title, content, duration, order_index)
SELECT id, '第1章：认识情绪', '情绪是什么？情绪是人类对外界刺激的心理和生理反应。本章将帮助你了解情绪的本质，识别不同类型的情绪。学习内容包括：基本情绪类型、情绪的生理反应、情绪的心理特征。', 15, 1
FROM courses WHERE title = '情绪识别与管理';

INSERT INTO course_chapters (course_id, title, content, duration, order_index)
SELECT id, '第2章：情绪的影响', '情绪如何影响我们的生活？本章探讨情绪对思维、行为和人际关系的影响。你将学会：识别情绪对决策的影响、理解情绪与健康的关系、认识情绪传染现象。', 15, 2
FROM courses WHERE title = '情绪识别与管理';

INSERT INTO course_chapters (course_id, title, content, duration, order_index)
SELECT id, '第3章：情绪管理技巧', '实用的情绪调节方法。学习如何有效管理自己的情绪，包括：深呼吸放松法、认知重构技巧、情绪表达方法、建立情绪支持系统。', 15, 3
FROM courses WHERE title = '情绪识别与管理';

-- 压力应对与放松的章节
INSERT INTO course_chapters (course_id, title, content, duration, order_index)
SELECT id, '第1章：认识压力', '什么是压力？压力是如何产生的？本章帮助你理解压力的来源和机制。学习内容：压力的定义、压力的类型、压力产生的原因。', 15, 1
FROM courses WHERE title = '压力应对与放松';

INSERT INTO course_chapters (course_id, title, content, duration, order_index)
SELECT id, '第2章：压力信号识别', '如何知道自己压力过大？学习识别身体和心理的压力信号。包括：身体症状、情绪变化、行为改变、思维模式变化。', 15, 2
FROM courses WHERE title = '压力应对与放松';

INSERT INTO course_chapters (course_id, title, content, duration, order_index)
SELECT id, '第3章：放松技巧实践', '科学的放松方法。学习并实践各种有效的放松技巧：渐进性肌肉放松、正念冥想、呼吸练习、想象放松法。', 20, 3
FROM courses WHERE title = '压力应对与放松';

-- 人际关系处理的章节
INSERT INTO course_chapters (course_id, title, content, duration, order_index)
SELECT id, '第1章：沟通基础', '有效沟通的基本原则。学习如何清晰表达、积极倾听、理解他人。建立良好沟通的基础。', 20, 1
FROM courses WHERE title = '人际关系处理';

INSERT INTO course_chapters (course_id, title, content, duration, order_index)
SELECT id, '第2章：冲突处理', '学习处理人际冲突的技巧。包括：冲突的类型、冲突解决策略、协商技巧、建立双赢思维。', 20, 2
FROM courses WHERE title = '人际关系处理';

INSERT INTO course_chapters (course_id, title, content, duration, order_index)
SELECT id, '第3章：建立良好关系', '如何建立和维护健康的人际关系。学习：建立信任、表达关心、设定界限、维护友谊。', 20, 3
FROM courses WHERE title = '人际关系处理';

-- ============================================
-- 3. 添加咨询师
-- ============================================

INSERT INTO counselors (name, title, specialties, avatar, bio, rating, total_consultations, is_available) VALUES
('李心怡', '国家二级心理咨询师', ARRAY['青少年心理', '情绪管理', '学习压力'], 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', '拥有10年青少年心理咨询经验，擅长情绪管理和青少年成长问题辅导。温和耐心，善于倾听，深受学生信任。', 4.9, 156, true),
('王建国', '心理学硕士', ARRAY['人际关系', '自我认知', '抑郁情绪'], 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', '心理学硕士，专注青少年发展心理学研究。善于引导学生进行自我探索，建立积极的自我认同。', 4.8, 203, true),
('张晓雯', '家庭治疗师', ARRAY['亲子关系', '家庭沟通', '青春期问题'], 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', '资深家庭治疗师，擅长处理亲子关系问题。帮助家庭建立良好的沟通模式，促进家庭和谐。', 4.9, 128, true),
('刘明', '青少年心理专家', ARRAY['学习焦虑', '考试压力', '时间管理'], 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', '专注于青少年学习心理研究，帮助学生克服学习焦虑，提升学习效率。实用主义导向，注重技巧训练。', 4.7, 94, true);

-- ============================================
-- 4. 查看插入结果
-- ============================================

SELECT '课程数量' as info, COUNT(*) as count FROM courses
UNION ALL
SELECT '章节数量', COUNT(*) FROM course_chapters
UNION ALL
SELECT '咨询师数量', COUNT(*) FROM counselors;

-- 显示所有课程
SELECT id, title, category, difficulty, duration, instructor, is_published 
FROM courses 
ORDER BY order_index;

-- 显示所有咨询师
SELECT id, name, title, rating, total_consultations, is_available
FROM counselors 
ORDER BY rating DESC;

-- 显示章节统计
SELECT c.title as course_title, COUNT(ch.id) as chapter_count
FROM courses c
LEFT JOIN course_chapters ch ON c.id = ch.course_id
GROUP BY c.id, c.title
ORDER BY c.order_index;

























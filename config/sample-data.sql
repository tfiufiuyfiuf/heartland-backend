-- 心屿学院 - 示例数据
-- 请在 Supabase SQL Editor 中执行此脚本

-- ============================================
-- 1. 添加示例课程
-- ============================================

-- 为了匹配 Supabase 中 courses 表(字段: title, description, category, difficulty, duration, cover_image, instructor, is_published, order_index)
INSERT INTO courses (title, description, category, difficulty, duration, cover_image, instructor, is_published, order_index) VALUES
('认识你的情绪', '学习识别和理解自己的情绪，掌握情绪管理的基本技巧', 'emotion', 'beginner', 45, 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800', '李心理老师', true, 1),
('情绪日记的力量', '通过写情绪日记来提升自我觉察，改善情绪健康', 'emotion', 'beginner', 30, 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800', '王心理老师', true, 2),
('学业压力应对指南', '学习有效的学业压力管理策略，提升学习效率', 'stress', 'intermediate', 60, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', '张老师', true, 3),
('深呼吸放松法', '学习简单有效的深呼吸技巧，快速缓解压力', 'stress', 'beginner', 20, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', '刘心理老师', true, 4),
('有效沟通的艺术', '学习沟通技巧，改善人际关系', 'relationship', 'intermediate', 50, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', '陈老师', true, 5),
('建立健康的友谊', '了解健康友谊的特征，学会建立和维护友谊', 'relationship', 'beginner', 40, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', '杨心理老师', true, 6),
('发现你的优势', '探索自己的优势和潜能，建立自信', 'growth', 'beginner', 55, 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', '周老师', true, 7),
('目标设定与实现', '学习SMART目标设定法，提升目标达成率', 'growth', 'intermediate', 45, 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800', '吴老师', true, 8);

-- 2. 添加示例咨询师
-- ============================================

-- Supabase counselors 表字段: name, title, specialties, avatar, bio, rating, total_consultations, is_available
INSERT INTO counselors (name, title, specialties, avatar, bio, rating, total_consultations, is_available) VALUES
('李心怡', '国家二级心理咨询师', ARRAY['青少年心理', '情绪管理', '学业压力'], 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', '专注于青少年心理健康，擅长情绪管理和学业压力疏导。温和耐心，深受学生喜爱。', 4.9, 156, true),
('王建国', '心理学博士', ARRAY['家庭关系', '人际交往', '自我认知'], 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', '心理学博士，在家庭治疗和青少年发展领域有深入研究。', 4.8, 203, true),
('张晓雯', '国家二级心理咨询师', ARRAY['焦虑抑郁', '情感困扰', '个人成长'], 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', '温暖共情，擅长陪伴青少年度过情绪困扰期，帮助建立积极心态。', 4.9, 128, true),
('刘明', '心理咨询师', ARRAY['学习困难', '注意力问题', '行为管理'], 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', '专注于学习心理和行为管理，帮助学生提升学习效率和自控能力。', 4.7, 94, true);

-- ============================================
-- 3. 添加示例社区帖子
-- ============================================

-- 注意：这里需要先有用户ID，所以这部分需要在有用户后手动添加
-- 或者你可以在前端测试时创建帖子

-- ============================================
-- 4. 添加示例树洞消息
-- ============================================

-- 同样需要用户ID，建议在前端测试时创建

-- ============================================
-- 5. 查看插入结果
-- ============================================

SELECT '课程数量：' as info, COUNT(*) as count FROM courses
UNION ALL
SELECT '咨询师数量：', COUNT(*) FROM counselors;

-- 显示所有课程
SELECT id, title, category, difficulty, duration, instructor, is_published 
FROM courses 
ORDER BY created_at DESC;

SELECT id, name, title, rating, total_consultations 
FROM counselors 
ORDER BY rating DESC;


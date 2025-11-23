-- 心屿学院数据库架构
-- 在Supabase SQL编辑器中执行此脚本

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= 用户相关表 =============

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar TEXT DEFAULT '👤',
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'parent', 'teacher', 'admin')),
  roles TEXT[] DEFAULT ARRAY['student']::TEXT[], -- 多角色支持
  house VARCHAR(20) DEFAULT 'none' CHECK (house IN ('none', 'gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff')),
  focus_time INTEGER DEFAULT 0, -- 专注时长（秒）
  points INTEGER DEFAULT 0, -- 积分
  level INTEGER DEFAULT 1, -- 等级
  bio TEXT, -- 个人简介
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户个人资料扩展表
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birthday DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  school VARCHAR(100),
  grade VARCHAR(20),
  interests TEXT[], -- 兴趣爱好
  emergency_contact VARCHAR(20), -- 紧急联系人
  emergency_phone VARCHAR(20), -- 紧急联系电话
  parent_phone VARCHAR(20), -- 家长手机号（用于关联）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 课程相关表 =============

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- emotion, stress, relationship, growth
  difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration INTEGER, -- 课程时长（分钟）
  cover_image TEXT,
  instructor VARCHAR(100),
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 课程章节表
CREATE TABLE IF NOT EXISTS course_chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  video_url TEXT,
  duration INTEGER, -- 章节时长（分钟）
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户课程进度表
CREATE TABLE IF NOT EXISTS user_course_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0, -- 视频播放位置（秒）
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- ============= 情绪追踪相关表 =============

-- 情绪记录表
CREATE TABLE IF NOT EXISTS mood_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mood_type VARCHAR(50) NOT NULL, -- happy, sad, anxious, angry, calm, excited
  mood_level INTEGER CHECK (mood_level BETWEEN 1 AND 5), -- 情绪强度
  note TEXT, -- 日记/笔记
  tags TEXT[], -- 标签
  weather VARCHAR(20), -- 天气
  location VARCHAR(100), -- 地点
  activities TEXT[], -- 活动
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 情绪分析报告表
CREATE TABLE IF NOT EXISTS mood_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(20) DEFAULT 'weekly' CHECK (report_type IN ('weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  summary TEXT, -- 分析总结
  suggestions TEXT[], -- 建议
  mood_stats JSONB, -- 情绪统计数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 社区相关表 =============

-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  content TEXT NOT NULL,
  category VARCHAR(50), -- discussion, share, question, achievement
  tags TEXT[],
  images TEXT[], -- 图片URL数组
  is_anonymous BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true, -- 是否通过审核
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 父评论ID（支持回复）
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ============= 树洞相关表 =============

-- 树洞消息表
CREATE TABLE IF NOT EXISTS treehole_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 可以为空（完全匿名）
  content TEXT NOT NULL,
  mood VARCHAR(50), -- 心情
  is_flagged BOOLEAN DEFAULT false, -- 是否被标记（需要关注）
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')), -- 风险等级
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 树洞回复表
CREATE TABLE IF NOT EXISTS treehole_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES treehole_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_from_counselor BOOLEAN DEFAULT false, -- 是否来自心理咨询师
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 专注学习相关表 =============

-- 专注记录表
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- 专注时长（秒）
  task_name VARCHAR(200),
  is_completed BOOLEAN DEFAULT false,
  interruptions INTEGER DEFAULT 0, -- 中断次数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 预约咨询相关表 =============

-- 咨询师表
CREATE TABLE IF NOT EXISTS counselors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(100), -- 职称
  specialties TEXT[], -- 专长领域
  avatar TEXT,
  bio TEXT,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_consultations INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预约记录表
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES counselors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER DEFAULT 50, -- 咨询时长（分钟）
  topic VARCHAR(200), -- 咨询主题
  note TEXT, -- 备注
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 教师相关表 =============

-- 班级表
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  school VARCHAR(100),
  grade VARCHAR(20),
  description TEXT,
  invite_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 班级成员表
CREATE TABLE IF NOT EXISTS class_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- ============= 系统相关表 =============

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- system, comment, like, reply, appointment
  title VARCHAR(200) NOT NULL,
  content TEXT,
  link TEXT, -- 相关链接
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 索引 =============

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_mood_records_user_date ON mood_records(user_id, created_at DESC);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_treehole_created ON treehole_messages(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_counselor ON appointments(counselor_id);
CREATE INDEX idx_class_members_class ON class_members(class_id);
CREATE INDEX idx_class_members_user ON class_members(user_id);

-- ============= 触发器：自动更新updated_at =============

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============= Row Level Security (RLS) =============

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treehole_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和修改自己的数据
CREATE POLICY users_select_own ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update_own ON users FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_select_own ON user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY profiles_all_own ON user_profiles FOR ALL USING (user_id = auth.uid());

CREATE POLICY mood_select_own ON mood_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY mood_all_own ON mood_records FOR ALL USING (user_id = auth.uid());

CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (user_id = auth.uid());

-- 帖子：所有人可查看已审核的，作者可以增删改查自己的
CREATE POLICY posts_select_approved ON posts FOR SELECT USING (is_approved = true);
CREATE POLICY posts_all_own ON posts FOR ALL USING (user_id = auth.uid());

-- 评论：所有人可查看，作者可以增删改查自己的
CREATE POLICY comments_select_all ON comments FOR SELECT USING (true);
CREATE POLICY comments_all_own ON comments FOR ALL USING (user_id = auth.uid());

-- 树洞：所有人可查看和创建，不允许修改删除（保护匿名性）
CREATE POLICY treehole_select_all ON treehole_messages FOR SELECT USING (true);
CREATE POLICY treehole_insert_all ON treehole_messages FOR INSERT WITH CHECK (true);

-- 预约：用户只能查看和管理自己的预约
CREATE POLICY appointments_select_own ON appointments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY appointments_all_own ON appointments FOR ALL USING (user_id = auth.uid());


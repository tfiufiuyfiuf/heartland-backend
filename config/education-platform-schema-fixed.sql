-- ============================================
-- 心屿学院 - 完整在线教育平台数据库架构扩展（修复版）
-- 包含：作业系统、班级管理、考试系统、支付系统、订单系统
-- ============================================

-- ============= 班级管理系统 =============

-- 班级表
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  grade VARCHAR(20),
  subject VARCHAR(50),
  semester VARCHAR(20),
  max_students INTEGER DEFAULT 50,
  current_students INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
  class_code VARCHAR(20) UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 班级成员表
CREATE TABLE IF NOT EXISTS class_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'assistant')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'removed', 'graduated')),
  UNIQUE(class_id, user_id)
);

-- 班级课程关联表
CREATE TABLE IF NOT EXISTS class_courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  schedule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, course_id)
);

-- ============= 作业系统 =============

-- 作业表
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assignment_type VARCHAR(20) DEFAULT 'homework' CHECK (assignment_type IN ('homework', 'quiz', 'project', 'exam')),
  content TEXT,
  attachments JSONB DEFAULT '[]',
  requirements TEXT,
  total_points INTEGER DEFAULT 100,
  start_time TIMESTAMP WITH TIME ZONE,
  due_time TIMESTAMP WITH TIME ZONE NOT NULL,
  late_submission_allowed BOOLEAN DEFAULT false,
  late_penalty_percent INTEGER DEFAULT 0,
  submission_type VARCHAR(20) DEFAULT 'text' CHECK (submission_type IN ('text', 'file', 'both', 'online_test')),
  max_attempts INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  publish_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 作业提交表
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  attachments JSONB DEFAULT '[]',
  submission_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_late BOOLEAN DEFAULT false,
  attempt_number INTEGER DEFAULT 1,
  score DECIMAL(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'resubmit_required')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id, attempt_number)
);

-- 作业评论
CREATE TABLE IF NOT EXISTS assignment_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 考试系统 =============

-- 试卷表
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  total_points INTEGER DEFAULT 100,
  pass_score INTEGER DEFAULT 60,
  duration_minutes INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  show_answers_after BOOLEAN DEFAULT false,
  max_attempts INTEGER DEFAULT 1,
  require_webcam BOOLEAN DEFAULT false,
  prevent_tab_switch BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'ended', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 试题表
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'essay')),
  question_text TEXT NOT NULL,
  question_image TEXT,
  options JSONB DEFAULT '[]',
  correct_answer TEXT,
  answer_explanation TEXT,
  points DECIMAL(5,2) NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 考试答题记录表
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submit_time TIMESTAMP WITH TIME ZONE,
  answers JSONB DEFAULT '{}',
  total_score DECIMAL(5,2),
  is_passed BOOLEAN,
  auto_graded BOOLEAN DEFAULT false,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'abandoned')),
  tab_switches INTEGER DEFAULT 0,
  violations JSONB DEFAULT '[]',
  UNIQUE(exam_id, student_id, attempt_number)
);

-- ============= 课程订单和支付系统 =============

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('course', 'membership', 'package', 'service')),
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  original_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  stock_count INTEGER,
  is_unlimited_stock BOOLEAN DEFAULT false,
  validity_days INTEGER,
  is_on_sale BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('wechat', 'alipay', 'union_pay', 'balance')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  transaction_id VARCHAR(100),
  coupon_code VARCHAR(50),
  status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'paid', 'delivered', 'completed', 'cancelled', 'refunded')),
  need_invoice BOOLEAN DEFAULT false,
  invoice_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单明细表
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  product_type VARCHAR(20) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  course_access_granted BOOLEAN DEFAULT false,
  access_start_date TIMESTAMP WITH TIME ZONE,
  access_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percent', 'fixed', 'free_shipping')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  applicable_products JSONB DEFAULT '[]',
  applicable_categories TEXT[],
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_limit INTEGER,
  user_limit INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 优惠券使用记录
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 教师收入和结算 =============

-- 教师收入记录
CREATE TABLE IF NOT EXISTS teacher_earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  platform_commission_rate DECIMAL(5,2) DEFAULT 20.00,
  platform_commission DECIMAL(10,2) NOT NULL,
  teacher_income DECIMAL(10,2) NOT NULL,
  settlement_status VARCHAR(20) DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'settled', 'withdrawn')),
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 提现记录
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  withdrawal_method VARCHAR(20) CHECK (withdrawal_method IN ('wechat', 'alipay', 'bank_card')),
  account_info JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
  processed_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 学习进度和成绩 =============

-- 学生成绩总表
CREATE TABLE IF NOT EXISTS student_grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  homework_avg_score DECIMAL(5,2),
  quiz_avg_score DECIMAL(5,2),
  attendance_rate DECIMAL(5,2),
  participation_score DECIMAL(5,2),
  midterm_score DECIMAL(5,2),
  final_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  grade VARCHAR(5),
  ranking INTEGER,
  teacher_comment TEXT,
  semester VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, course_id, semester)
);

-- ============= 索引优化 =============

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user ON class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_time ON assignments(due_time);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_exams_class ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_teacher ON teacher_earnings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_status ON teacher_earnings(settlement_status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_teacher ON withdrawals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_student_grades_student ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_class ON student_grades(class_id);

-- ============= 触发器 =============

-- 更新班级学生数量
CREATE OR REPLACE FUNCTION update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE classes SET current_students = current_students + 1 WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE classes SET current_students = current_students - 1 WHERE id = OLD.class_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_class_student_count ON class_members;
CREATE TRIGGER trigger_update_class_student_count
AFTER INSERT OR DELETE ON class_members
FOR EACH ROW EXECUTE FUNCTION update_class_student_count();

-- 更新updated_at时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============= 完成提示 =============

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ 教育平台数据库架构创建完成！';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📚 已创建的功能模块：';
  RAISE NOTICE '   ✓ 班级管理系统';
  RAISE NOTICE '   ✓ 作业系统';
  RAISE NOTICE '   ✓ 考试系统';
  RAISE NOTICE '   ✓ 支付订单系统';
  RAISE NOTICE '   ✓ 教师收入结算';
  RAISE NOTICE '   ✓ 学生成绩管理';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 已配置：';
  RAISE NOTICE '   ✓ 30+ 索引优化';
  RAISE NOTICE '   ✓ 自动触发器';
  RAISE NOTICE '   ✓ 数据完整性约束';
  RAISE NOTICE '';
  RAISE NOTICE '📝 下一步：';
  RAISE NOTICE '   1. 在 Vercel 重新部署后端';
  RAISE NOTICE '   2. 测试 API 接口';
  RAISE NOTICE '   3. 开始使用！';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
END $$;


-- 心屿学院 - 完整在线教育平台数据库架构扩展（修复版）
-- 包含：作业系统、班级管理、考试系统、支付系统、订单系统
-- ============================================

-- ============= 班级管理系统 =============

-- 班级表
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  grade VARCHAR(20),
  subject VARCHAR(50),
  semester VARCHAR(20),
  max_students INTEGER DEFAULT 50,
  current_students INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
  class_code VARCHAR(20) UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 班级成员表
CREATE TABLE IF NOT EXISTS class_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'assistant')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'removed', 'graduated')),
  UNIQUE(class_id, user_id)
);

-- 班级课程关联表
CREATE TABLE IF NOT EXISTS class_courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  schedule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, course_id)
);

-- ============= 作业系统 =============

-- 作业表
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assignment_type VARCHAR(20) DEFAULT 'homework' CHECK (assignment_type IN ('homework', 'quiz', 'project', 'exam')),
  content TEXT,
  attachments JSONB DEFAULT '[]',
  requirements TEXT,
  total_points INTEGER DEFAULT 100,
  start_time TIMESTAMP WITH TIME ZONE,
  due_time TIMESTAMP WITH TIME ZONE NOT NULL,
  late_submission_allowed BOOLEAN DEFAULT false,
  late_penalty_percent INTEGER DEFAULT 0,
  submission_type VARCHAR(20) DEFAULT 'text' CHECK (submission_type IN ('text', 'file', 'both', 'online_test')),
  max_attempts INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  publish_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 作业提交表
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  attachments JSONB DEFAULT '[]',
  submission_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_late BOOLEAN DEFAULT false,
  attempt_number INTEGER DEFAULT 1,
  score DECIMAL(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'resubmit_required')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id, attempt_number)
);

-- 作业评论
CREATE TABLE IF NOT EXISTS assignment_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 考试系统 =============

-- 试卷表
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  total_points INTEGER DEFAULT 100,
  pass_score INTEGER DEFAULT 60,
  duration_minutes INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  show_answers_after BOOLEAN DEFAULT false,
  max_attempts INTEGER DEFAULT 1,
  require_webcam BOOLEAN DEFAULT false,
  prevent_tab_switch BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'ended', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 试题表
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'essay')),
  question_text TEXT NOT NULL,
  question_image TEXT,
  options JSONB DEFAULT '[]',
  correct_answer TEXT,
  answer_explanation TEXT,
  points DECIMAL(5,2) NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 考试答题记录表
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submit_time TIMESTAMP WITH TIME ZONE,
  answers JSONB DEFAULT '{}',
  total_score DECIMAL(5,2),
  is_passed BOOLEAN,
  auto_graded BOOLEAN DEFAULT false,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'abandoned')),
  tab_switches INTEGER DEFAULT 0,
  violations JSONB DEFAULT '[]',
  UNIQUE(exam_id, student_id, attempt_number)
);

-- ============= 课程订单和支付系统 =============

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('course', 'membership', 'package', 'service')),
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  original_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  stock_count INTEGER,
  is_unlimited_stock BOOLEAN DEFAULT false,
  validity_days INTEGER,
  is_on_sale BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('wechat', 'alipay', 'union_pay', 'balance')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  transaction_id VARCHAR(100),
  coupon_code VARCHAR(50),
  status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'paid', 'delivered', 'completed', 'cancelled', 'refunded')),
  need_invoice BOOLEAN DEFAULT false,
  invoice_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单明细表
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  product_type VARCHAR(20) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  course_access_granted BOOLEAN DEFAULT false,
  access_start_date TIMESTAMP WITH TIME ZONE,
  access_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percent', 'fixed', 'free_shipping')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  applicable_products JSONB DEFAULT '[]',
  applicable_categories TEXT[],
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_limit INTEGER,
  user_limit INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 优惠券使用记录
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 教师收入和结算 =============

-- 教师收入记录
CREATE TABLE IF NOT EXISTS teacher_earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  platform_commission_rate DECIMAL(5,2) DEFAULT 20.00,
  platform_commission DECIMAL(10,2) NOT NULL,
  teacher_income DECIMAL(10,2) NOT NULL,
  settlement_status VARCHAR(20) DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'settled', 'withdrawn')),
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 提现记录
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  withdrawal_method VARCHAR(20) CHECK (withdrawal_method IN ('wechat', 'alipay', 'bank_card')),
  account_info JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
  processed_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= 学习进度和成绩 =============

-- 学生成绩总表
CREATE TABLE IF NOT EXISTS student_grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  homework_avg_score DECIMAL(5,2),
  quiz_avg_score DECIMAL(5,2),
  attendance_rate DECIMAL(5,2),
  participation_score DECIMAL(5,2),
  midterm_score DECIMAL(5,2),
  final_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  grade VARCHAR(5),
  ranking INTEGER,
  teacher_comment TEXT,
  semester VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, course_id, semester)
);

-- ============= 索引优化 =============

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user ON class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_time ON assignments(due_time);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_exams_class ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_teacher ON teacher_earnings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_status ON teacher_earnings(settlement_status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_teacher ON withdrawals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_student_grades_student ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_class ON student_grades(class_id);

-- ============= 触发器 =============

-- 更新班级学生数量
CREATE OR REPLACE FUNCTION update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE classes SET current_students = current_students + 1 WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE classes SET current_students = current_students - 1 WHERE id = OLD.class_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_class_student_count ON class_members;
CREATE TRIGGER trigger_update_class_student_count
AFTER INSERT OR DELETE ON class_members
FOR EACH ROW EXECUTE FUNCTION update_class_student_count();

-- 更新updated_at时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============= 完成提示 =============

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ 教育平台数据库架构创建完成！';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📚 已创建的功能模块：';
  RAISE NOTICE '   ✓ 班级管理系统';
  RAISE NOTICE '   ✓ 作业系统';
  RAISE NOTICE '   ✓ 考试系统';
  RAISE NOTICE '   ✓ 支付订单系统';
  RAISE NOTICE '   ✓ 教师收入结算';
  RAISE NOTICE '   ✓ 学生成绩管理';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 已配置：';
  RAISE NOTICE '   ✓ 30+ 索引优化';
  RAISE NOTICE '   ✓ 自动触发器';
  RAISE NOTICE '   ✓ 数据完整性约束';
  RAISE NOTICE '';
  RAISE NOTICE '📝 下一步：';
  RAISE NOTICE '   1. 在 Vercel 重新部署后端';
  RAISE NOTICE '   2. 测试 API 接口';
  RAISE NOTICE '   3. 开始使用！';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
END $$;





















































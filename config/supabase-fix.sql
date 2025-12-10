-- 心屿学院 - 数据库修复脚本
-- 如果遇到 "column does not exist" 错误，使用此脚本

-- ============= 步骤1：清理旧表（谨慎操作！会删除所有数据） =============

-- 如果你是第一次安装，执行这部分来清理可能存在的旧表
-- 注意：这会删除所有数据！

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS system_configs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS class_members CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS counselors CASCADE;
DROP TABLE IF EXISTS focus_sessions CASCADE;
DROP TABLE IF EXISTS treehole_replies CASCADE;
DROP TABLE IF EXISTS treehole_messages CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS mood_reports CASCADE;
DROP TABLE IF EXISTS mood_records CASCADE;
DROP TABLE IF EXISTS user_course_progress CASCADE;
DROP TABLE IF EXISTS course_chapters CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============= 步骤2：重新执行 supabase-schema.sql =============
-- 清理完成后，请重新执行 supabase-schema.sql 文件的全部内容

-- ============= 步骤3：验证表结构 =============
-- 执行以下查询来验证 users 表的列

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 应该看到以下列：
-- id, phone, username, password_hash, avatar, role, roles, house, 
-- focus_time, points, level, bio, email, is_active, created_at, updated_at

























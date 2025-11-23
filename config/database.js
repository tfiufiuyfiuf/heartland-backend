import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// 创建Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// 允许在Vercel环境中缺少配置（通过环境变量配置）
if (!supabaseUrl && process.env.NODE_ENV !== 'production') {
  console.warn('警告: 缺少 SUPABASE_URL 环境变量');
}
if (!supabaseAnonKey && process.env.NODE_ENV !== 'production') {
  console.warn('警告: 缺少 SUPABASE_ANON_KEY 或 SUPABASE_KEY 环境变量');
}

// 公共客户端（用于认证和公开操作）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

// 管理员客户端（用于需要绕过RLS的操作）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 测试数据库连接
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').single();
    if (error && error.code !== 'PGRST116') {
      console.error('数据库连接测试失败:', error);
      return false;
    }
    console.log('✓ Supabase数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接测试异常:', error);
    return false;
  }
}


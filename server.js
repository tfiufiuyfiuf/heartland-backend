import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// 导入路由
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import moodRoutes from './routes/mood.js';
import coursesRoutes from './routes/courses.js';
import postsRoutes from './routes/posts.js';
import treeholeRoutes from './routes/treehole.js';
import appointmentsRoutes from './routes/appointments.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============= 中间件配置 =============

// 安全头部
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS配置
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 压缩响应
app.use(compression());

// 日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100个请求
  message: { success: false, message: '请求过于频繁，请稍后再试' }
});
app.use('/api/', limiter);

// 更严格的认证接口限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 15分钟内最多10次
  message: { success: false, message: '登录尝试次数过多，请稍后再试' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============= 路由配置 =============

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: '心屿学院API',
    version: '1.0.0'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/treehole', treeholeRoutes);
app.use('/api/appointments', appointmentsRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '接口不存在' 
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============= 启动服务器 =============

// 启动前测试数据库连接
async function startServer() {
  try {
    console.log('正在连接数据库...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('X 数据库连接失败,请检查配置');
      process.exit(1);
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`✓ 服务器启动成功`);
      console.log(`✓ 监听端口: ${PORT}`);
      console.log(`✓ 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ 健康检查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 导出 app（用于 Vercel 或其他平台）
export default app;

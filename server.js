import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import moodRoutes from './routes/mood.js';
import courseRoutes from './routes/courses.js';
import postsRoutes from './routes/posts.js';
import treeholeRoutes from './routes/treehole.js';
import appointmentRoutes from './routes/appointments.js';
import { testConnection } from './config/database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============= 中间件配置 =============

// CORS - 使用 cors 包
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// 安全头部
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

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

// 速率限制 - 跳过OPTIONS请求
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: '请求过于频繁，请稍后再试' },
  skip: (req) => req.method === 'OPTIONS'
});
app.use('/api/', limiter);

// ============= 路由配置 =============

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/community', postsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/treehole', treeholeRoutes);
app.use('/api/appointments', appointmentRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '心屿学院 API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      mood: '/api/mood',
      courses: '/api/courses',
      community: '/api/community',
      posts: '/api/posts',
      treehole: '/api/treehole',
      appointments: '/api/appointments'
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.path
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('错误:', err);
  
  // 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors
    });
  }
  
  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'token已过期'
    });
  }
  
  // 默认错误
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============= 服务器启动 =============

async function startServer() {
  try {
    console.log('正在连接数据库...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('╔═══════════════════════════════════════╗');
      console.log('║                                       ║');
      console.log('║      心屿学院 API 服务已启动 🚀      ║');
      console.log('║                                       ║');
      console.log('╚═══════════════════════════════════════╝');
      console.log('');
      console.log(`🌐 服务地址: http://0.0.0.0:${PORT}`);
      console.log(`📝 健康检查: http://0.0.0.0:${PORT}/health`);
      console.log(`🔒 环境模式: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();

export default app;

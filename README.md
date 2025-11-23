# 心屿学院后端API服务

青少年心理健康学习平台的后端服务，基于Node.js + Express + Supabase构建。

## 技术栈

- **运行环境**: Node.js 18+
- **Web框架**: Express.js
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT (JSON Web Tokens)
- **安全**: Helmet, CORS, Rate Limiting
- **其他**: bcryptjs (密码加密), express-validator (数据验证)

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
# Supabase配置（从Supabase控制台获取）
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT密钥（生成一个随机字符串）
JWT_SECRET=your_very_secure_random_secret_key_here
JWT_EXPIRE=7d

# 服务器配置
PORT=3000
NODE_ENV=development

# 前端地址（用于CORS）
FRONTEND_URL=http://localhost:5500
```

### 3. 初始化数据库

在Supabase控制台的SQL编辑器中，依次执行：

1. `config/supabase-schema.sql` - 创建数据库表结构
2. `config/supabase-functions.sql` - 创建数据库函数

### 4. 启动开发服务器

```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API文档

### 认证接口

#### 发送验证码
- **POST** `/api/auth/send-code`
- Body: `{ phone: "13800138000" }`

#### 用户注册
- **POST** `/api/auth/register`
- Body: 
  ```json
  {
    "phone": "13800138000",
    "username": "张三",
    "password": "password123",
    "verificationCode": "123456"
  }
  ```

#### 用户登录
- **POST** `/api/auth/login`
- Body: 
  ```json
  {
    "phone": "13800138000",
    "password": "password123"
  }
  ```

#### 验证Token
- **GET** `/api/auth/verify`
- Headers: `Authorization: Bearer <token>`

### 用户接口

所有用户接口都需要在Header中携带认证token：
```
Authorization: Bearer <your_jwt_token>
```

#### 获取当前用户信息
- **GET** `/api/users/me`

#### 更新用户信息
- **PUT** `/api/users/me`
- Body: `{ username, email, bio, avatar }`

#### 更新个人资料
- **PUT** `/api/users/profile`
- Body: `{ birthday, gender, school, grade, interests }`

#### 获取用户统计
- **GET** `/api/users/stats`

#### 记录专注时长
- **POST** `/api/users/focus`
- Body: `{ duration, task_name, is_completed }`

#### 获取通知列表
- **GET** `/api/users/notifications?page=1&limit=20`

### 情绪追踪接口

#### 创建情绪记录
- **POST** `/api/mood`
- Body: 
  ```json
  {
    "mood_type": "happy",
    "mood_level": 4,
    "note": "今天很开心",
    "tags": ["学校", "朋友"],
    "weather": "晴天"
  }
  ```

#### 获取情绪记录列表
- **GET** `/api/mood?page=1&limit=20`

#### 获取情绪统计
- **GET** `/api/mood/stats?days=7`

#### 删除情绪记录
- **DELETE** `/api/mood/:id`

### 课程接口

#### 获取课程列表
- **GET** `/api/courses?category=emotion&page=1`

#### 获取课程详情
- **GET** `/api/courses/:id`

#### 更新学习进度
- **POST** `/api/courses/:courseId/chapters/:chapterId/progress`
- Body: `{ progress_percentage, last_position, is_completed }`

#### 获取我的学习进度
- **GET** `/api/courses/my/progress`

### 社区接口

#### 获取帖子列表
- **GET** `/api/posts?category=discussion&page=1`

#### 获取帖子详情
- **GET** `/api/posts/:id`

#### 发布帖子
- **POST** `/api/posts`
- Body: 
  ```json
  {
    "title": "标题",
    "content": "内容",
    "category": "discussion",
    "tags": ["标签1", "标签2"],
    "is_anonymous": false
  }
  ```

#### 评论帖子
- **POST** `/api/posts/:id/comments`
- Body: `{ content, parent_id, is_anonymous }`

#### 点赞/取消点赞
- **POST** `/api/posts/:id/like`

#### 删除帖子
- **DELETE** `/api/posts/:id`

### 树洞接口

#### 获取树洞消息列表
- **GET** `/api/treehole?page=1`

#### 获取树洞消息详情
- **GET** `/api/treehole/:id`

#### 发送树洞消息
- **POST** `/api/treehole`
- Body: `{ content, mood }`

#### 回复树洞消息
- **POST** `/api/treehole/:id/replies`
- Body: `{ content }`

### 预约咨询接口

#### 获取咨询师列表
- **GET** `/api/appointments/counselors`

#### 获取咨询师详情
- **GET** `/api/appointments/counselors/:id`

#### 创建预约
- **POST** `/api/appointments`
- Body: 
  ```json
  {
    "counselor_id": "uuid",
    "appointment_date": "2024-01-20",
    "appointment_time": "14:00",
    "topic": "学习压力",
    "note": "备注"
  }
  ```

#### 获取我的预约列表
- **GET** `/api/appointments/my?status=pending`

#### 取消预约
- **PUT** `/api/appointments/:id/cancel`

## 数据库架构

主要数据表：

- `users` - 用户表
- `user_profiles` - 用户个人资料
- `courses` - 课程表
- `course_chapters` - 课程章节
- `user_course_progress` - 学习进度
- `mood_records` - 情绪记录
- `mood_reports` - 情绪报告
- `posts` - 帖子
- `comments` - 评论
- `likes` - 点赞
- `treehole_messages` - 树洞消息
- `treehole_replies` - 树洞回复
- `focus_sessions` - 专注记录
- `counselors` - 咨询师
- `appointments` - 预约记录
- `classes` - 班级
- `class_members` - 班级成员
- `notifications` - 通知

详细的数据库架构请查看 `config/supabase-schema.sql`。

## 安全特性

1. **JWT认证**: 所有需要认证的接口都使用JWT进行验证
2. **密码加密**: 使用bcrypt加密存储用户密码
3. **速率限制**: 防止暴力破解和API滥用
4. **CORS保护**: 只允许指定域名访问
5. **安全头部**: 使用Helmet添加安全HTTP头部
6. **输入验证**: 使用express-validator验证所有输入数据
7. **RLS**: Supabase行级安全策略保护数据

## 部署指南

### Vercel部署（推荐）

1. 安装Vercel CLI: `npm i -g vercel`
2. 在项目根目录运行: `vercel`
3. 配置环境变量
4. 部署完成

### Railway部署

1. 连接GitHub仓库
2. 选择backend目录
3. 配置环境变量
4. 自动部署

### Docker部署

```bash
# 构建镜像
docker build -t heartland-api .

# 运行容器
docker run -p 3000:3000 --env-file .env heartland-api
```

## 开发指南

### 添加新的API接口

1. 在 `routes/` 目录下创建或编辑路由文件
2. 实现业务逻辑
3. 在 `server.js` 中注册路由
4. 更新API文档

### 添加数据库表

1. 在 `config/supabase-schema.sql` 中添加表结构
2. 在Supabase控制台执行SQL
3. 更新相关的API接口

### 测试

```bash
# 运行测试（需要先配置测试环境）
npm test
```

## 故障排查

### 数据库连接失败
- 检查 `.env` 文件中的Supabase配置是否正确
- 确认Supabase项目是否已启动
- 检查网络连接

### JWT验证失败
- 确认JWT_SECRET配置正确
- 检查token是否过期
- 确认请求头格式：`Authorization: Bearer <token>`

### 接口返回500错误
- 查看服务器日志
- 检查数据库表结构是否正确
- 确认环境变量配置

## 许可证

MIT License

## 支持

如有问题，请联系开发团队或提交Issue。


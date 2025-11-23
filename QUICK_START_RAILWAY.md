# ⚡ Railway 快速部署指南

## 🎯 5分钟部署到 Railway

### 前置准备

- ✅ GitHub 账号
- ✅ 后端代码已准备好
- ✅ Supabase 环境变量（从 Vercel 复制）

---

## 🚀 三步部署

### 步骤 1: 安装 Railway CLI

```powershell
npm install -g @railway/cli
```

### 步骤 2: 登录并初始化

```powershell
# 进入后端目录
cd backend

# 登录 Railway
railway login

# 创建新项目
railway init

# 选择 "Empty Project"
# 输入项目名称: heartland-backend
```

### 步骤 3: 添加环境变量并部署

```powershell
# 添加环境变量（替换为你的实际值）
railway variables set SUPABASE_URL="https://your-project.supabase.co"
railway variables set SUPABASE_ANON_KEY="your-anon-key"
railway variables set SUPABASE_SERVICE_KEY="your-service-key"
railway variables set JWT_SECRET="your-32-character-secret"
railway variables set JWT_EXPIRE="7d"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://heartland-webapp.vercel.app"

# 部署！
railway up
```

**等待 2-3 分钟，部署完成！**

---

## 🌐 获取生产 URL

```powershell
# 生成公开域名
railway domain
```

会得到类似：`https://heartland-backend-production-xxxx.up.railway.app`

---

## 🧪 测试

```powershell
# 测试健康检查（替换为你的 URL）
curl https://your-app.railway.app/health
```

---

## 🔄 更新前端配置

编辑 `heartland-webapp/frontend/config.js`：

```javascript
const CONFIG = {
  API: {
    BASE_URL: 'https://your-app.railway.app'  // 你的 Railway URL
  }
};
```

重新部署前端：

```powershell
cd heartland-webapp
vercel --prod
```

---

## ✅ 完成！

现在访问：
- 前端：https://heartland-webapp.vercel.app/student-login.html
- 后端：https://your-app.railway.app/health

**CORS 问题应该彻底解决了！** 🎉

---

## 📝 常用命令

```powershell
# 查看日志
railway logs

# 查看环境变量
railway variables

# 重新部署
railway up

# 打开控制台
railway open
```

---

## 💡 提示

1. **环境变量很重要**：确保所有环境变量都配置正确
2. **检查日志**：如果部署失败，用 `railway logs` 查看错误
3. **数据库连接**：确保 Supabase 可以从外部访问
4. **CORS 测试**：部署后立即测试前端是否能访问后端

---

## 🆘 遇到问题？

查看详细指南：`RAILWAY_DEPLOYMENT.md`


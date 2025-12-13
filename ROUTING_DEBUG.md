# 路由调试指南

## 问题：/api/sorting/submit 返回 404

### 可能的原因：

1. **Render 部署未更新**
   - 检查 Render Dashboard：https://dashboard.render.com
   - 确认最新部署已完成
   - 查看部署日志是否有错误

2. **路由注册顺序问题**
   - 确保 `app.use('/api/sorting', sortingRoutes);` 在404处理器之前
   - 检查 `server.js` 中的路由注册顺序

3. **中间件问题**
   - `authenticateToken` 中间件可能提前返回了404
   - 检查 token 是否正确传递

### 检查步骤：

1. 访问：`https://heartland-backend.onrender.com/api/sorting/questions`
   - 如果这个可以访问，说明路由注册正常
   
2. 访问：`https://heartland-backend.onrender.com/api/health`
   - 检查后端是否正常运行

3. 检查 Render 日志
   - 查看是否有路由注册的日志
   - 查看是否有错误信息


#!/bin/bash

# Railway 部署脚本（Bash）

echo "====================================="
echo "   心屿学院后端 - Railway 部署"
echo "====================================="
echo ""

# 检查是否安装了 Railway CLI
echo "检查 Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI 未安装"
    echo "正在安装 Railway CLI..."
    npm install -g @railway/cli
    if [ $? -ne 0 ]; then
        echo "❌ 安装失败，请手动安装：npm install -g @railway/cli"
        exit 1
    fi
fi
echo "✅ Railway CLI 已安装"
echo ""

# 检查环境变量文件
echo "检查环境变量..."
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件"
    echo "请从 Vercel 复制环境变量，或创建 .env 文件"
    echo ""
fi

# 登录 Railway
echo "登录 Railway..."
railway login
if [ $? -ne 0 ]; then
    echo "❌ 登录失败"
    exit 1
fi
echo "✅ 登录成功"
echo ""

# 询问是否需要初始化项目
echo "是否需要初始化新项目？(Y/N)"
read init
if [ "$init" = "Y" ] || [ "$init" = "y" ]; then
    echo "初始化 Railway 项目..."
    railway init
    if [ $? -ne 0 ]; then
        echo "❌ 初始化失败"
        exit 1
    fi
    echo "✅ 项目初始化成功"
    echo ""
fi

# 询问是否配置环境变量
echo "是否需要配置环境变量？(Y/N)"
read configEnv
if [ "$configEnv" = "Y" ] || [ "$configEnv" = "y" ]; then
    echo ""
    echo "请输入以下环境变量（从 Vercel 复制）："
    echo ""
    
    echo -n "SUPABASE_URL: "
    read supabaseUrl
    railway variables set SUPABASE_URL="$supabaseUrl"
    
    echo -n "SUPABASE_ANON_KEY: "
    read supabaseAnonKey
    railway variables set SUPABASE_ANON_KEY="$supabaseAnonKey"
    
    echo -n "SUPABASE_SERVICE_KEY: "
    read supabaseServiceKey
    railway variables set SUPABASE_SERVICE_KEY="$supabaseServiceKey"
    
    echo -n "JWT_SECRET: "
    read jwtSecret
    railway variables set JWT_SECRET="$jwtSecret"
    
    railway variables set JWT_EXPIRE="7d"
    railway variables set NODE_ENV="production"
    railway variables set FRONTEND_URL="https://heartland-webapp.vercel.app"
    
    echo "✅ 环境变量配置完成"
    echo ""
fi

# 部署
echo "开始部署到 Railway..."
echo ""
railway up

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ 部署失败，请检查日志"
    echo "运行以下命令查看日志：railway logs"
    exit 1
fi

echo ""
echo "✅ 部署成功！"
echo ""

# 生成域名
echo "生成公开访问域名..."
railway domain

echo ""
echo "====================================="
echo "   部署完成！"
echo "====================================="
echo ""
echo "下一步："
echo "1. 复制上面显示的 Railway URL"
echo "2. 更新前端配置文件中的 API_BASE_URL"
echo "3. 重新部署前端到 Vercel"
echo "4. 测试应用是否正常工作"
echo ""
echo "查看日志：railway logs"
echo "打开控制台：railway open"
echo ""


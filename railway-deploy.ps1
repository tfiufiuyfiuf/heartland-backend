# Railway 部署脚本（PowerShell）

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   心屿学院后端 - Railway 部署" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了 Railway CLI
Write-Host "检查 Railway CLI..." -ForegroundColor Yellow
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI 未安装" -ForegroundColor Red
    Write-Host "正在安装 Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 安装失败，请手动安装：npm install -g @railway/cli" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Railway CLI 已安装" -ForegroundColor Green
Write-Host ""

# 检查环境变量文件
Write-Host "检查环境变量..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host "⚠️  未找到 .env 文件" -ForegroundColor Yellow
    Write-Host "请从 Vercel 复制环境变量，或创建 .env 文件" -ForegroundColor Yellow
    Write-Host ""
}

# 登录 Railway
Write-Host "登录 Railway..." -ForegroundColor Yellow
railway login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 登录失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 登录成功" -ForegroundColor Green
Write-Host ""

# 询问是否需要初始化项目
Write-Host "是否需要初始化新项目？(Y/N)" -ForegroundColor Yellow
$init = Read-Host
if ($init -eq "Y" -or $init -eq "y") {
    Write-Host "初始化 Railway 项目..." -ForegroundColor Yellow
    railway init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 初始化失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 项目初始化成功" -ForegroundColor Green
    Write-Host ""
}

# 询问是否配置环境变量
Write-Host "是否需要配置环境变量？(Y/N)" -ForegroundColor Yellow
$configEnv = Read-Host
if ($configEnv -eq "Y" -or $configEnv -eq "y") {
    Write-Host ""
    Write-Host "请输入以下环境变量（从 Vercel 复制）：" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "SUPABASE_URL: " -NoNewline
    $supabaseUrl = Read-Host
    railway variables set SUPABASE_URL="$supabaseUrl"
    
    Write-Host "SUPABASE_ANON_KEY: " -NoNewline
    $supabaseAnonKey = Read-Host
    railway variables set SUPABASE_ANON_KEY="$supabaseAnonKey"
    
    Write-Host "SUPABASE_SERVICE_KEY: " -NoNewline
    $supabaseServiceKey = Read-Host
    railway variables set SUPABASE_SERVICE_KEY="$supabaseServiceKey"
    
    Write-Host "JWT_SECRET: " -NoNewline
    $jwtSecret = Read-Host
    railway variables set JWT_SECRET="$jwtSecret"
    
    railway variables set JWT_EXPIRE="7d"
    railway variables set NODE_ENV="production"
    railway variables set FRONTEND_URL="https://heartland-webapp.vercel.app"
    
    Write-Host "✅ 环境变量配置完成" -ForegroundColor Green
    Write-Host ""
}

# 部署
Write-Host "开始部署到 Railway..." -ForegroundColor Yellow
Write-Host ""
railway up

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 部署失败，请检查日志" -ForegroundColor Red
    Write-Host "运行以下命令查看日志：railway logs" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ 部署成功！" -ForegroundColor Green
Write-Host ""

# 生成域名
Write-Host "生成公开访问域名..." -ForegroundColor Yellow
railway domain

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   部署完成！" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 复制上面显示的 Railway URL" -ForegroundColor White
Write-Host "2. 更新前端配置文件中的 API_BASE_URL" -ForegroundColor White
Write-Host "3. 重新部署前端到 Vercel" -ForegroundColor White
Write-Host "4. 测试应用是否正常工作" -ForegroundColor White
Write-Host ""
Write-Host "查看日志：railway logs" -ForegroundColor Cyan
Write-Host "打开控制台：railway open" -ForegroundColor Cyan
Write-Host ""


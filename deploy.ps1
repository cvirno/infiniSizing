# Script de Deploy Automatizado para infiniSizing
Write-Host "🚀 Preparando deploy da aplicação infiniSizing..." -ForegroundColor Green

# 1. Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

# 2. Fazer build da aplicação
Write-Host "🔨 Fazendo build da aplicação..." -ForegroundColor Yellow
npm run build

# 3. Criar arquivo ZIP para deploy
Write-Host "📦 Criando arquivo ZIP para deploy..." -ForegroundColor Yellow
if (Test-Path "infiniSizing-deploy.zip") {
    Remove-Item "infiniSizing-deploy.zip" -Force
}
Compress-Archive -Path "dist\*" -DestinationPath "infiniSizing-deploy.zip" -Force

# 4. Verificar se tudo foi criado
Write-Host "✅ Verificando arquivos..." -ForegroundColor Green
if (Test-Path "dist\index.html") {
    Write-Host "✅ Build criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    exit 1
}

if (Test-Path "infiniSizing-deploy.zip") {
    Write-Host "✅ Arquivo ZIP criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao criar ZIP!" -ForegroundColor Red
    exit 1
}

# 5. Mostrar instruções
Write-Host ""
Write-Host "🎉 TUDO PRONTO!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Vá para: https://app.netlify.com/drop" -ForegroundColor White
Write-Host "2. Arraste o arquivo: infiniSizing-deploy.zip" -ForegroundColor White
Write-Host "3. Aguarde alguns segundos" -ForegroundColor White
Write-Host "4. Sua aplicação estará online!" -ForegroundColor White
Write-Host ""
Write-Host "📁 Arquivo ZIP criado em:" -ForegroundColor Yellow
Write-Host "$(Get-Location)\infiniSizing-deploy.zip" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Para GitHub Desktop:" -ForegroundColor Cyan
Write-Host "1. Abra GitHub Desktop" -ForegroundColor White
Write-Host "2. Add Existing Repository" -ForegroundColor White
Write-Host "3. Selecione: $(Get-Location)" -ForegroundColor White
Write-Host "4. Publish Repository" -ForegroundColor White 
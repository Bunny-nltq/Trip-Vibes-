@echo off
setlocal
cd /d "%~dp0"
set LIVE_AI_ENABLED=true
set DATA_MODE=snapshot
echo Trip Vibes - ban trinh dien local voi Gemini AI (su dung khoa trong .env.local).
echo Mo trinh duyet: http://localhost:3001
echo Giu cua so nay mo. Dung may chu bang Ctrl+C.
echo Neu cong 3001 da co may chu, dung ban dang chay tai dia chi tren.
node --version
if errorlevel 1 goto missingnode
if not exist "node_modules\next\dist\bin\next" goto missingpackages
node -e "const s=require('node:net').createServer();s.once('error',()=>process.exit(10));s.listen(3001,'localhost',()=>s.close(()=>process.exit(0)));"
if errorlevel 10 goto alreadyrunning
echo Dang bien dich ban trinh dien, vui long cho...
node node_modules\next\dist\bin\next build --webpack
if errorlevel 1 goto done
node node_modules\next\dist\bin\next start --hostname localhost --port 3001
goto done
:missingnode
echo Can cai Node.js 22.14 tro len.
goto done
:missingpackages
echo Chua co thu vien. Mo terminal trong thu muc nay va chay npm install.
goto done
:alreadyrunning
echo Cong 3001 dang duoc su dung. Chua khoi dong may chu moi.
echo Mo http://localhost:3001 de xem ban dang chay. Neu can doi che do, dung may chu cu truoc.
goto done
:done
pause
endlocal

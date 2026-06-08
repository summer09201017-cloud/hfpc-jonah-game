@echo off
chcp 65001 >nul
setlocal enableextensions
title 約拿闖關 - 啟動中
cd /d "%~dp0"

echo ============================================
echo    約拿闖關 - 啟動遊戲
echo ============================================
echo.

REM ---- 確認有 Node.js ----
where node >nul 2>&1
if errorlevel 1 (
  echo  找不到 Node.js。請先到 https://nodejs.org 安裝後再試。
  echo.
  pause
  exit /b 1
)

REM ---- 第一次執行:安裝必要套件 ----
if not exist "node_modules" (
  echo [1/3] 第一次執行,正在安裝必要套件(約 1-2 分鐘,只有第一次)...
  call npm install
  if errorlevel 1 (
    echo.
    echo  安裝失敗,請把上面的訊息截圖給我。
    pause
    exit /b 1
  )
) else (
  echo [1/3] 套件已安裝,略過。
)

REM ---- 找一個沒被占用的連接埠(從 5173 往上找,避開保羅大富翁等)----
set /a PORT=5173
set /a TRIES=0
:findport
netstat -ano | findstr "LISTENING" | findstr ":%PORT% " >nul 2>&1
if %errorlevel% NEQ 0 goto gotport
set /a PORT+=1
set /a TRIES+=1
if %TRIES% GEQ 50 (
  echo  找不到可用的連接埠,請關掉一些程式再試。
  pause
  exit /b 1
)
goto findport
:gotport

set "URL=http://localhost:%PORT%/"
echo [2/3] 啟動遊戲伺服器(連接埠 %PORT%)...
echo.
echo    遊戲網址:%URL%
echo    *** 會另外開一個黑色視窗當伺服器,玩的時候請保持開著;結束遊戲就關掉它。***
echo.

REM 在另一個視窗啟動 Vite(指定剛找到的空埠)
start "約拿闖關 伺服器 :%PORT% (關掉即結束)" cmd /k "npm run dev -- --port %PORT% --strictPort --host"

REM ---- 等伺服器真的起來,再開瀏覽器(避免開到空白頁)----
echo [3/3] 等待伺服器啟動後自動開啟瀏覽器...
powershell -NoProfile -Command "for($i=0;$i -lt 150;$i++){ try{ $c=[Net.Sockets.TcpClient]::new(); $c.Connect('localhost',%PORT%); $c.Close(); exit 0 }catch{ Start-Sleep -Milliseconds 400 } }; exit 1"
start "" "%URL%"

echo.
echo  已開啟瀏覽器。若沒自動打開,請手動開:%URL%
echo  (這個視窗可以關掉;伺服器在另一個視窗。)
echo.
timeout /t 4 /nobreak >nul
exit /b 0

@echo off
REM Jonah Game launcher. English-only on purpose: Chinese characters in a .bat
REM get mangled by the console code page and break parsing.
setlocal enableextensions
title Jonah Game - launcher
cd /d "%~dp0"

echo ============================================
echo    Jonah Game (Yue-Na)  -  starting...
echo ============================================
echo.

REM ---- need Node.js ----
where node >nul 2>&1
if errorlevel 1 (
  echo  Node.js not found. Install it from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)

REM ---- first run: install packages ----
if not exist "node_modules" (
  echo [1/3] First run - installing packages (about 1-2 min, only once)...
  call npm install
  if errorlevel 1 (
    echo.
    echo  Install failed. Please screenshot the message above.
    pause
    exit /b 1
  )
) else (
  echo [1/3] Packages already installed - skipping.
)

REM ---- find a free port (scan up from 5173; avoids ports taken by other apps) ----
set /a PORT=5173
set /a TRIES=0
:findport
netstat -ano | findstr "LISTENING" | findstr ":%PORT% " >nul 2>&1
if %errorlevel% NEQ 0 goto gotport
set /a PORT+=1
set /a TRIES+=1
if %TRIES% GEQ 50 (
  echo  No free port found. Close some apps and try again.
  pause
  exit /b 1
)
goto findport
:gotport

set "URL=http://localhost:%PORT%/"
echo [2/3] Starting game server on port %PORT% ...
echo.
echo    Game URL: %URL%
echo    *** A separate black "server" window will open. Keep it open while playing;
echo        close it to stop the game. ***
echo.

REM Start Vite on the chosen free port in its own window
start "Jonah Game server :%PORT% (close to stop)" cmd /k "npm run dev -- --port %PORT% --strictPort --host"

REM ---- wait until the server actually answers, then open the browser ----
echo [3/3] Waiting for the server, then opening the browser...
powershell -NoProfile -Command "for($i=0;$i -lt 150;$i++){ try{ $c=[Net.Sockets.TcpClient]::new(); $c.Connect('localhost',%PORT%); $c.Close(); exit 0 }catch{ Start-Sleep -Milliseconds 400 } }; exit 1"
start "" "%URL%"

echo.
echo  Browser opened. If not, open this manually: %URL%
echo  (You can close THIS window; the server runs in the other one.)
echo.
timeout /t 4 /nobreak >nul
exit /b 0

@echo off
echo Attempting to start server...
echo.
npx cross-env NODE_ENV=development npx tsx server/index.ts > server-output.txt 2>&1
echo.
echo Server run complete.
echo.
echo --- OUTPUT START ---
type server-output.txt
echo --- OUTPUT END ---
pause

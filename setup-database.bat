@echo off
echo Creating PostgreSQL database 'glee_planner'...
echo.
echo This will prompt you for the PostgreSQL password you set during installation.
echo.
pause
createdb -U postgres glee_planner
if %errorlevel% equ 0 (
    echo.
    echo ✓ Database created successfully!
    echo.
    echo Now running database migrations...
    npm run db:push
) else (
    echo.
    echo ✗ Failed to create database. 
    echo Make sure PostgreSQL is running and the password is correct.
)
pause

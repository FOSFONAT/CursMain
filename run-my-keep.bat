@echo off
setlocal
set "ROOT=%~dp0"

if not exist "%ROOT%my-keep-api\MyKeep.Api.csproj" (
    echo Could not find the API project under "%ROOT%my-keep-api".
    pause
    exit /b 1
)

if not exist "%ROOT%my-keep\package.json" (
    echo Could not find the frontend under "%ROOT%my-keep".
    pause
    exit /b 1
)

where dotnet >nul 2>nul
if errorlevel 1 (
    echo .NET SDK was not found. Install the .NET 10 SDK first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo npm was not found. Install Node.js first.
    pause
    exit /b 1
)

if not exist "%ROOT%my-keep\node_modules\next" (
    echo Frontend dependencies are missing. Run "npm ci" in "%ROOT%my-keep" first.
    pause
    exit /b 1
)

echo Ensure the SQL Server Docker container is running.
powershell.exe -NoProfile -Command "$busy = @(Get-NetTCPConnection -State Listen -LocalPort 3000,5062 -ErrorAction SilentlyContinue); if ($busy.Count -gt 0) { $busy | Select-Object -ExpandProperty LocalPort -Unique | ForEach-Object { Write-Output ('Port ' + $_ + ' is already in use.') }; exit 1 }"
if errorlevel 1 (
    echo Stop the existing service using that port, then run this launcher again.
    pause
    exit /b 1
)

start "My Keep API" /D "%ROOT%my-keep-api" cmd /k dotnet run --launch-profile http
start "My Keep Frontend" /D "%ROOT%my-keep" cmd /k npm run dev

echo.
echo API and Frontend are opening in separate console windows.
echo API:      http://localhost:5062
echo Frontend: http://localhost:3000
echo Close either console window to stop its service.

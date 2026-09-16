@echo off
echo Installing Node-Print Bridge as a Windows Service...

:: Note: We recommend using NSSM (Non-Sucking Service Manager) for Node.js apps.
:: Download NSSM from http://nssm.cc/ and ensure nssm.exe is in PATH

set SERVICE_NAME=NodePrintBridge
set EXE_PATH=%~dp0\node-print-win.exe

if not exist "%EXE_PATH%" (
    echo [ERROR] %EXE_PATH% not found! Please compile it first using 'npm run package'.
    pause
    exit /b 1
)

nssm install "%SERVICE_NAME%" "%EXE_PATH%" start
nssm set "%SERVICE_NAME%" Description "Node-Print Local Bridge Service"
nssm set "%SERVICE_NAME%" Start SERVICE_AUTO_START
nssm start "%SERVICE_NAME%"

echo Node-Print Service Installed and Started Successfully!
pause

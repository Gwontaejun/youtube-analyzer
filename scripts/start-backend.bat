@echo off
setlocal
cd /d "%~dp0..\backend"

if not exist ".venv\Scripts\python.exe" (
  echo Creating the Python virtual environment and installing packages...
  py -m venv .venv
  if errorlevel 1 exit /b 1
  .venv\Scripts\python.exe -m pip install -r requirements.txt
  if errorlevel 1 exit /b 1
)

.venv\Scripts\python.exe -m uvicorn app.main:app --reload
endlocal

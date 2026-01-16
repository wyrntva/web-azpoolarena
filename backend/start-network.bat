@echo off
echo Starting Backend Server on Network IP...
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause

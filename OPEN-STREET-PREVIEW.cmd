@echo off
cd /d "%~dp0"
py -3 scripts\build.py
if errorlevel 1 exit /b 1
start "" "%~dp0dist\STREET-PREVIEW.html"

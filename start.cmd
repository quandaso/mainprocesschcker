@echo off
:loop

node src/app.js

timeout 5
goto loop

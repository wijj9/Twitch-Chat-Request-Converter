@echo off
echo Converting CSV to TXT format...
echo.

set INPUT_FILE=chat_messages.csv
set OUTPUT_FILE=chat_messages.txt

if not exist "%INPUT_FILE%" (
    echo Error: %INPUT_FILE% not found!
    pause
    exit /b 1
)

echo Input file: %INPUT_FILE%
echo Output file: %OUTPUT_FILE%
echo.

copy "%INPUT_FILE%" "%OUTPUT_FILE%" > nul

if %errorlevel% equ 0 (
    echo Conversion completed successfully!
    echo You can now upload %OUTPUT_FILE% to the web application.
) else (
    echo Error during conversion!
)

echo.
pause

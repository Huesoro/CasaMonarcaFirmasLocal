@echo off
REM Activar el entorno de anaconda (ajusta el nombre si tu entorno no se llama 'casa')
call conda activate casa

REM Iniciar el backend FastAPI en una nueva ventana
start "FastAPI" cmd /k "uvicorn api_donaciones:app --reload"

REM Iniciar el frontend Next.js en la ventana actual
npm run dev 
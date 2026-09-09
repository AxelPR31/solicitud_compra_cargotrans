@echo off
echo ========================================================
echo Iniciando Servidor Frontend de Produccion Softland ERP
echo Forzando mayusculas/minusculas de la ruta correcta...
echo ========================================================
cd /d C:\Users\LENOVO\Desktop\AppsCorpsoft\CS_ERP\cs_erp_frontend
if exist .next (
    echo Limpiando cache antigua...
    rmdir /s /q .next
)
echo Iniciando pnpm run dev con Webpack...
pnpm run dev

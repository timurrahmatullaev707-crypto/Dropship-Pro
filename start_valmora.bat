@echo off
title VALMORA - Commerce & Telegram
color 06
echo =========================================================================
echo    VALMORA - COMMERCE
echo =========================================================================
echo    Mijozlar Do'koni (Storefront): http://localhost:8080
echo    Boshqaruv Markazi (Admin):    http://localhost:8080/admin.html
echo    Telegram Sozlamalari:         http://localhost:8080/settings.html
echo    Interactive API Docs:         http://localhost:8080/api/docs
echo =========================================================================
python valmora_server.py
pause

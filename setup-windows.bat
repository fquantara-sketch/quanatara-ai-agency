@echo off
REM ============================================================
REM  Quanatara - Setup ya backend na APK kwa Windows
REM  Mbofyo mara mbili kwenye file hili, na kila kitu kinaenda.
REM ============================================================

setlocal

echo.
echo ============================================
echo   QUANATARA - KUANDAA BACKEND NA APK
echo ============================================
echo.

REM ---- 1. Angalia kama Node.js ipo ----
where node >nul 2>nul
if errorlevel 1 (
    echo [TATIZO] Node.js haipo kwenye kompyuta hii.
    echo.
    echo Pakua kutoka: https://nodejs.org
    echo Weka toleo la LTS, kisha fungua file hili tena.
    echo.
    pause
    exit /b 1
)
echo [SAWA] Node.js imepatikana.
node --version

REM ---- 2. Angalia kama uko kwenye folder la mradi ----
if not exist "package.json" (
    echo.
    echo [TATIZO] Hukosi kwenye folder la mradi.
    echo.
    echo Nakusaidia kwenda hapo...
    if exist "%USERPROFILE%\Desktop\quanatara-ai-agency\package.json" (
        cd /d "%USERPROFILE%\Desktop\quanatara-ai-agency"
        echo [SAWA] Nimeingia: %CD%
    ) else (
        echo [TATIZO] Sikuipata folder la mradi kwenye Desktop.
        echo.
        echo Ingia kwenye folder lenye package.json kisha endesha file hili tena.
        pause
        exit /b 1
    )
) else (
    echo [SAWA] Uko kwenye folder la mradi: %CD%
)
echo.

REM ---- 3. Angalia .env ----
if not exist ".env" (
    echo [!] Haipo .env - naifanya sasa.
    (
        echo EXPO_PUBLIC_SUPABASE_URL=https://smszwcvryknxxwjihuax.supabase.co
        echo EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable__ilgld7adO-SdYF7y047bQ_dpdPPeIa
    ) > .env
    echo [SAWA] .env imefanywa.
)
echo.

REM ---- 4. Angalia key ya DeepSeek ----
findstr /C:"sk-your-deepseek-api-key-here" .env >nul 2>nul
if not errorlevel 1 (
    echo ============================================
    echo   SUBIRI - UWEKE KEY YAKO YA DEEPSEEK
    echo ============================================
    echo.
    echo Fungua .env na uweke key yako halisi ya DeepSeek.
    echo Kama huna, ipate kutoka: https://platform.deepseek.com
    echo.
    echo Baada ya kuweka, endesha file hili tena.
    echo.
    notepad .env
    pause
    exit /b 1
)
echo [SAWA] .env inaonekana sawa.
echo.

REM ---- 5. Supabase login ----
echo ============================================
echo   HATUA 1: KUINGIA SUPABASE
echo ============================================
echo.
echo Browser itafunguka. Bonyeza ku-approve kisha kurudi hapa.
echo.
call npx supabase login
if errorlevel 1 (
    echo.
    echo [TATIZO] Kuingia kulishindwa. Jaribu tena.
    pause
    exit /b 1
)
echo.

REM ---- 6. Link project ----
echo ============================================
echo   HATUA 2: KUUNGANISHA PROJECT
echo ============================================
echo.
echo Itakuuliza database password.
echo Hiyo ni password ya project yako ya Supabase.
echo.
call npx supabase link --project-ref smszwcvryknxxwjihuax
if errorlevel 1 (
    echo.
    echo [TATIZO] Kuunganisha project kulishindwa.
    echo Kama ni password, ipate kutoka:
    echo Supabase Dashboard ^> Project Settings ^> Database ^> Reset password
    echo.
    pause
    exit /b 1
)
echo.

REM ---- 7. Secrets ----
echo ============================================
echo   HATUA 3: KUWEKA KEY YA DEEPSEEK
echo ============================================
echo.
echo Itakuuliza thamani ya DEEPSEEK_API_KEY.
echo Weka key yako halisi, kisha bonyeza Enter.
echo.
call npx supabase secrets set DEEPSEEK_API_KEY
if errorlevel 1 (
    echo.
    echo [TATIZO] Kuweka secret kulishindwa.
    pause
    exit /b 1
)
echo.

REM ---- 8. Deploy function ----
echo ============================================
echo   HATUA 4: KUWEKA BACKEND LIVE
echo ============================================
echo.
call npx supabase functions deploy chat --no-verify-jwt
if errorlevel 1 (
    echo.
    echo [TATIZO] Kuweka function kulishindwa.
    pause
    exit /b 1
)
echo.
echo [SAWA] Backend yako ipo live!
echo.

REM ---- 9. APK ----
echo ============================================
echo   HATUA 5: KUJENGA APK
echo ============================================
echo.
echo Kwanza napakua packages...
call npm install
if errorlevel 1 (
    echo.
    echo [TATIZO] Kupakua packages kulishindwa.
    pause
    exit /b 1
)
echo.
echo Sasa kuingia Expo. Browser itafunguka - fungua akaunti
echo ya bure kama huna moja.
echo.
call npx eas login
if errorlevel 1 (
    echo.
    echo [TATIZO] Kuingia Expo kulishindwa.
    pause
    exit /b 1
)
echo.
echo Sasa najenga APK. Hii inachukua dakika 15-20.
echo Usifunge dirisha hili!
echo.
call npx eas build -p android --profile preview
if errorlevel 1 (
    echo.
    echo [TATIZO] Kujenga APK kulishindwa.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   KILA KITU KIMEKAMILIKA!
echo ============================================
echo.
echo Link ya kupakua APK yako ipo juu.
echo.
pause

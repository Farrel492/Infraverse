Write-Host "Checking frontend folder..." -ForegroundColor Cyan
if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

Write-Host "Fix LoginPage, RegisterPage, DashboardPage, MappingPage, DigitalTwinPage, and SimulationController..." -ForegroundColor Cyan
Write-Host "SELESAI. Silakan refresh halaman (Ctrl + Shift + R)." -ForegroundColor Green
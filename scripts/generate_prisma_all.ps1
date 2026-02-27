param(
    [string[]]$AppDirs = @(
        "."
    )
)

$root = Split-Path -Parent $PSScriptRoot

Write-Host "Generating Prisma clients from root schema..." -ForegroundColor Cyan
Write-Host ("Root: {0}" -f $root)

foreach ($dir in $AppDirs) {
    $appPath = Join-Path $root $dir
    if (-not (Test-Path $appPath)) {
        Write-Warning ("Skip missing app: {0}" -f $appPath)
        continue
    }

    Write-Host ("- {0}" -f $appPath) -ForegroundColor Yellow
    Push-Location $appPath
    try {
        npx prisma generate
        if ($LASTEXITCODE -ne 0) {
            throw "prisma generate failed in $appPath"
        }
    } finally {
        Pop-Location
    }
}

Write-Host "Done." -ForegroundColor Green

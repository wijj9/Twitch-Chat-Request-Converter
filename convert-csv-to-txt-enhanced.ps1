# Enhanced CSV to TXT Converter with Data Cleaning
# This script converts CSV files to TXT format and optionally cleans the data

param(
    [Parameter(Mandatory=$false)]
    [string]$InputFile = "chat_messages.csv",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "chat_messages.txt",
    
    [Parameter(Mandatory=$false)]
    [switch]$Clean = $false
)

Write-Host "Enhanced CSV to TXT Converter for Twitch Chat Viewer" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "Input file: $InputFile" -ForegroundColor Yellow
Write-Host "Output file: $OutputFile" -ForegroundColor Yellow
Write-Host "Clean data: $Clean" -ForegroundColor Yellow
Write-Host ""

# Check if input file exists
if (-not (Test-Path $InputFile)) {
    Write-Error "Input file '$InputFile' not found!"
    Write-Host "Available CSV files in current directory:" -ForegroundColor Cyan
    Get-ChildItem -Filter "*.csv" | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
    exit 1
}

try {
    Write-Host "Reading input file..." -ForegroundColor Green
    
    if ($Clean) {
        Write-Host "Cleaning data (removing trailing semicolons)..." -ForegroundColor Green
        # Clean the data by removing trailing semicolons
        Get-Content $InputFile | ForEach-Object { $_ -replace ';+$', '' } | Set-Content $OutputFile -Encoding UTF8
    } else {
        Write-Host "Copying file without modifications..." -ForegroundColor Green
        # Simple copy
        $content = Get-Content $InputFile -Raw
        Set-Content -Path $OutputFile -Value $content -Encoding UTF8
    }
    
    # Get file statistics
    $inputInfo = Get-Item $InputFile
    $outputInfo = Get-Item $OutputFile
    $lineCount = (Get-Content $OutputFile).Count
    
    Write-Host "`nConversion completed successfully!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "Input file size: $([math]::Round($inputInfo.Length/1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Output file size: $([math]::Round($outputInfo.Length/1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Total lines: $($lineCount.ToString('N0'))" -ForegroundColor Cyan
    Write-Host "Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
    
    if ($Clean) {
        $sizeDiff = $inputInfo.Length - $outputInfo.Length
        Write-Host "Data cleaned: $([math]::Round($sizeDiff/1KB, 2)) KB removed" -ForegroundColor Yellow
    }
    
    Write-Host "`nNext steps:" -ForegroundColor Magenta
    Write-Host "1. Open your web application" -ForegroundColor White
    Write-Host "2. Upload the file: $OutputFile" -ForegroundColor White
    Write-Host "3. Enjoy your Twitch chat viewer!" -ForegroundColor White
    
} catch {
    Write-Error "Error during conversion: $($_.Exception.Message)"
    exit 1
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

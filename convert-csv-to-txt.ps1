# CSV to TXT Converter for Twitch Chat Viewer
# This script converts CSV files to TXT format for the web application

param(
    [Parameter(Mandatory=$false)]
    [string]$InputFile = "chat_messages.csv",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "chat_messages.txt"
)

Write-Host "Converting CSV to TXT format..." -ForegroundColor Green
Write-Host "Input file: $InputFile" -ForegroundColor Yellow
Write-Host "Output file: $OutputFile" -ForegroundColor Yellow

# Check if input file exists
if (-not (Test-Path $InputFile)) {
    Write-Error "Input file '$InputFile' not found!"
    exit 1
}

try {
    # Read the CSV file and copy it to TXT
    # This preserves the exact formatting that RainbowCSV shows
    $content = Get-Content $InputFile -Raw
    
    # Write to output file
    Set-Content -Path $OutputFile -Value $content -Encoding UTF8
    
    # Get file info
    $inputSize = (Get-Item $InputFile).Length
    $outputSize = (Get-Item $OutputFile).Length
    $lineCount = (Get-Content $OutputFile).Count
    
    Write-Host "`nConversion completed successfully!" -ForegroundColor Green
    Write-Host "Input file size: $([math]::Round($inputSize/1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Output file size: $([math]::Round($outputSize/1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Total lines: $lineCount" -ForegroundColor Cyan
    Write-Host "`nYou can now upload '$OutputFile' to the web application." -ForegroundColor Yellow
    
} catch {
    Write-Error "Error during conversion: $($_.Exception.Message)"
    exit 1
}

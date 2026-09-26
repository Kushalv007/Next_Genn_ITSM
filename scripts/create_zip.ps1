$src = 'C:\Users\kv2k0\Desktop\vibe'
$destDesktop = 'C:\Users\kv2k0\Desktop\Next-Gen-ITSM-deployable.zip'
$destVibe = 'C:\Users\kv2k0\Desktop\vibe\Next-Gen-ITSM-deployable.zip'
$tempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), 'itsm_clean_' + [System.Guid]::NewGuid().ToString('N'))

Write-Host "Creating clean staging directory: $tempDir"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$excludeNames = @('node_modules', '.git', 'dev-db', 'Next-Gen-ITSM-deployable.zip')

Get-ChildItem -Path $src | ForEach-Object {
    if ($_.Name -notin $excludeNames) {
        Copy-Item -Path $_.FullName -Destination $tempDir -Recurse -Force
    }
}

# Ensure no nested node_modules
Get-ChildItem -Path $tempDir -Directory -Filter "node_modules" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
Get-ChildItem -Path $tempDir -Filter "*.zip" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force

if (Test-Path $destDesktop) { Remove-Item $destDesktop -Force }
if (Test-Path $destVibe) { Remove-Item $destVibe -Force }

Write-Host "Compressing staging folder to $destDesktop..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $destDesktop -CompressionLevel Optimal

Write-Host "Copying to $destVibe..."
Copy-Item -Path $destDesktop -Destination $destVibe -Force

Remove-Item -Path $tempDir -Recurse -Force
Write-Host "Done! Verification:"
Get-Item -Path $destDesktop, $destVibe | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize

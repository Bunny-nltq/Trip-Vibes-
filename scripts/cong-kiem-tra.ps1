param([Parameter(Mandatory=$true)][string]$MaNV)
$dir = "docs/bang-chung/dem/$MaNV"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding $false
$lenh = [ordered]@{ "vitest"="npx vitest run"; "typecheck"="npm run typecheck"; "build"="npm run build"; "check-colors"="npm run check:colors"; "check-contrast"="npm run check:contrast"; "check-emoji"="npm run check:emoji"; "check-env"="npm run check:env" }
$dong = @(); $dat = $true
foreach ($ten in $lenh.Keys) {
  $out = (Invoke-Expression "$($lenh[$ten]) 2>&1" | Out-String)
  $code = $LASTEXITCODE
  [System.IO.File]::WriteAllText((Join-Path (Resolve-Path $dir).Path "$ten.txt"), $out, $utf8)
  if ($code -eq 0) { $tt = "DAT" } else { $tt = "LOI"; $dat = $false }
  $dong += "$ten : $tt (exit $code)"
  if ($ten -eq "vitest") { $dong += ($out -split "`r?`n" | Where-Object { $_ -match "Test Files|^\s*Tests\s" } | ForEach-Object { "  " + $_.Trim() }) }
}
if ($dat) { $dong += "TONG: DAT" } else { $dong += "TONG: LOI" }
[System.IO.File]::WriteAllLines((Join-Path (Resolve-Path $dir).Path "KET-QUA.txt"), $dong, $utf8)
$dong | ForEach-Object { Write-Output $_ }
if ($dat) { exit 0 } else { exit 1 }

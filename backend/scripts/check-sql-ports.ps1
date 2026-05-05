param(
  [string]$Server = "",
  [string]$Ports = "1433,14330,14333,51433,51533,49152,49153,49154,49155"
)

if (-not $Server) {
  $envFile = Join-Path $PSScriptRoot "..\.env"

  if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match '^DB_SERVER=' } | Select-Object -First 1
    if ($line) {
      $serverValue = $line.Substring(10).Trim()
      if ($serverValue -match "\\") {
        $Server = ($serverValue -split "\\", 2)[0]
      } else {
        $Server = $serverValue
      }
    }
  }
}

if (-not $Server) {
  throw "Informe -Server <host> ou configure DB_SERVER no .env."
}

$portList = $Ports.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ }

if ($portList.Count -eq 0) {
  throw "Nenhuma porta valida informada em -Ports."
}

Write-Output "Testing SQL TCP ports on $Server ..."

$results = foreach ($port in $portList) {
  $ok = Test-NetConnection -ComputerName $Server -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet

  [PSCustomObject]@{
    Server   = $Server
    Port     = $port
    Reachable = [bool]$ok
  }
}

$results | Sort-Object Port | Format-Table -AutoSize

$open = $results | Where-Object { $_.Reachable }

if ($open.Count -eq 0) {
  Write-Output ""
  Write-Output "No tested ports are reachable."
  exit 2
}

Write-Output ""
Write-Output "Reachable ports:"
$open | Sort-Object Port | ForEach-Object { Write-Output " - $($_.Port)" }

param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$Usuario = "operador.manha",
  [string]$Senha = "Operador@123",
  [int]$Count = 30
)

$ErrorActionPreference = "Stop"

function Stop-BackendProcess($process) {
  if ($null -ne $process -and -not $process.HasExited) {
    cmd /c "taskkill /PID $($process.Id) /T /F" | Out-Null
  }
}

function Get-StatusCodeFromException($errorRecord) {
  try {
    if ($errorRecord.Exception.Response -and $errorRecord.Exception.Response.StatusCode) {
      return [int]$errorRecord.Exception.Response.StatusCode
    }
  } catch {
    return 0
  }

  return 0
}

function Get-Percentile([double[]]$sorted, [double]$p) {
  if ($sorted.Count -eq 0) {
    return 0
  }

  $idx = [math]::Floor(($sorted.Count - 1) * $p)
  return [math]::Round($sorted[$idx], 2)
}

function Invoke-Benchmark {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [int]$RequestCount
  )

  $samples = New-Object System.Collections.Generic.List[Double]
  $statusHistogram = @{}

  for ($i = 0; $i -lt $RequestCount; $i++) {
    $watch = [System.Diagnostics.Stopwatch]::StartNew()
    $statusCode = 0

    try {
      $response = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $Url -Headers $Headers -TimeoutSec 20
      $statusCode = [int]$response.StatusCode
    } catch {
      $statusCode = Get-StatusCodeFromException $_

      if ($statusCode -eq 0) {
        # 599 = erro de rede/timeout no benchmark
        $statusCode = 599
      }
    }

    $watch.Stop()
    $samples.Add($watch.Elapsed.TotalMilliseconds)

    $codeKey = [string]$statusCode
    if (-not $statusHistogram.ContainsKey($codeKey)) {
      $statusHistogram[$codeKey] = 0
    }
    $statusHistogram[$codeKey]++
  }

  $arr = $samples.ToArray()
  [array]::Sort($arr)

  $statusSummary = ($statusHistogram.GetEnumerator() |
      Sort-Object Name |
      ForEach-Object { "$($_.Name):$($_.Value)" }) -join ", "

  return [PSCustomObject]@{
    endpoint = $Name
    requests = $RequestCount
    status = $statusSummary
    minMs = [math]::Round($arr[0], 2)
    avgMs = [math]::Round((($arr | Measure-Object -Average).Average), 2)
    p50Ms = Get-Percentile $arr 0.5
    p95Ms = Get-Percentile $arr 0.95
    maxMs = [math]::Round($arr[$arr.Length - 1], 2)
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Resolve-Path (Join-Path $scriptDir "..")
$healthUrl = "$BaseUrl/health"
$serverProcess = $null

try {
  $isHealthy = $false

  try {
    $healthResponse = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 2
    $isHealthy = $healthResponse.StatusCode -eq 200
  } catch {
    $isHealthy = $false
  }

  if (-not $isHealthy) {
    Write-Host "Subindo backend local para benchmark..."
    $serverProcess = Start-Process -FilePath "node" -ArgumentList "dist/server.js" -WorkingDirectory $backendDir -PassThru

    for ($retry = 0; $retry -lt 60; $retry++) {
      try {
        $healthResponse = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 2
        if ($healthResponse.StatusCode -eq 200) {
          $isHealthy = $true
          break
        }
      } catch {
        Start-Sleep -Milliseconds 500
      }
    }
  }

  if (-not $isHealthy) {
    throw "Backend nao ficou pronto em tempo habil."
  }

  $loginBody = @{ usuario = $Usuario; senha = $Senha } | ConvertTo-Json
  $loginResponse = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" -ContentType "application/json" -Body $loginBody
  $token = $loginResponse.token

  if (-not $token) {
    throw "Falha ao autenticar para benchmark."
  }

  $headers = @{ Authorization = "Bearer $token" }

  $results = @()
  $results += Invoke-Benchmark -Name "GET /api/relatorios/aberto" -Method "GET" -Url "$BaseUrl/api/relatorios/aberto" -Headers $headers -RequestCount $Count
  $results += Invoke-Benchmark -Name "GET /api/relatorios/fechados?page=1&pageSize=10" -Method "GET" -Url "$BaseUrl/api/relatorios/fechados?page=1&pageSize=10" -Headers $headers -RequestCount $Count
  $results += Invoke-Benchmark -Name "GET /api/relatorios/fechados?page=1&pageSize=10&busca=abc" -Method "GET" -Url "$BaseUrl/api/relatorios/fechados?page=1&pageSize=10&busca=abc" -Headers $headers -RequestCount $Count

  $detailId = $null
  try {
    $closedResponse = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/relatorios/fechados?page=1&pageSize=1" -Headers $headers -TimeoutSec 10
    if ($closedResponse.data -and $closedResponse.data.Count -gt 0) {
      $detailId = [int]$closedResponse.data[0].id
    }
  } catch {
    $detailId = $null
  }

  if ($detailId) {
    $results += Invoke-Benchmark -Name "GET /api/relatorios/$detailId" -Method "GET" -Url "$BaseUrl/api/relatorios/$detailId" -Headers $headers -RequestCount $Count
  }

  Write-Host ""
  Write-Host "Benchmark concluido ($Count req por endpoint):"
  $results | Format-Table -AutoSize
} finally {
  Stop-BackendProcess $serverProcess
}

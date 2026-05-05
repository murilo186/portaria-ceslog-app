param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$PrismaArgs
)

$envFile = Join-Path $PSScriptRoot "..\.env"

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $separatorIndex = $line.IndexOf("=")
    if ($separatorIndex -lt 1) {
      return
    }

    $key = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1).Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    if (-not [Environment]::GetEnvironmentVariable($key)) {
      [Environment]::SetEnvironmentVariable($key, $value)
    }
  }
}

$requiredVars = @("DB_SERVER", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD")

foreach ($name in $requiredVars) {
  $value = [Environment]::GetEnvironmentVariable($name)
  if (-not $value) {
    throw "Missing required env var: $name"
  }
}

$server = $env:DB_SERVER
$explicitInstance = $env:DB_INSTANCE
$port = $env:DB_PORT
$database = $env:DB_DATABASE
$username = $env:DB_USERNAME
$password = $env:DB_PASSWORD
$trustCertRaw = if ($env:DB_TRUST_CERT) { $env:DB_TRUST_CERT } else { "yes" }

$instanceName = $null
$hostServer = $server

if ($server -match "\\") {
  $parts = $server -split "\\", 2
  $hostServer = $parts[0]
  $instanceName = $parts[1]
}

if ($explicitInstance) {
  $instanceName = $explicitInstance
}

$dbHost = if ($port) { "${hostServer}:$port" } else { $hostServer }
$trustServerCertificate = if ($trustCertRaw -match "^(?i:true|yes|1)$") { "true" } else { "false" }
$usernameEncoded = [Uri]::EscapeDataString($username)
$passwordEncoded = [Uri]::EscapeDataString($password)

$databaseEncoded = [Uri]::EscapeDataString($database)
$instanceParam = if ($instanceName) { ";instance=$instanceName" } else { "" }
$env:DATABASE_URL = "sqlserver://${dbHost};database=${databaseEncoded};user=${usernameEncoded};password=${passwordEncoded}${instanceParam};encrypt=true;trustServerCertificate=${trustServerCertificate}"

if (-not $PrismaArgs -or $PrismaArgs.Count -eq 0) {
  $PrismaArgs = @("generate")
}

& npx prisma @PrismaArgs
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
  exit $exitCode
}

param(
  [string]$SupabaseUrl,
  [string]$ServiceRoleKey,
  [string]$TestPassword = "CDxe4yhvOAZWAtifXc!9"
)

$ErrorActionPreference = "Stop"

function Normalize-SupabaseUrl {
  param([string]$Value)

  if ($null -eq $Value) {
    $clean = ""
  } else {
    $clean = $Value.Trim().Trim('"').Trim("'")
  }
  if (-not $clean) {
    throw "Supabase Project URL fehlt."
  }

  $uri = [Uri]$clean
  if (-not $uri.Host.EndsWith(".supabase.co")) {
    throw "Keine gültige Supabase-URL. Erwartet: https://projekt-ref.supabase.co"
  }

  return "https://$($uri.Host)"
}

function ConvertTo-PlainText {
  param([System.Security.SecureString]$SecureValue)

  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

if (-not $SupabaseUrl) {
  $SupabaseUrl = Read-Host "Development Supabase Project URL"
}

if (-not $ServiceRoleKey) {
  $secureKey = Read-Host "Development Service Role Key" -AsSecureString
  $ServiceRoleKey = ConvertTo-PlainText $secureKey
}

$normalizedUrl = Normalize-SupabaseUrl $SupabaseUrl
$projectRef = ([Uri]$normalizedUrl).Host.Split(".")[0]

Write-Host "[seed:development] Projekt: $projectRef"
Write-Host "[seed:development] URL: $normalizedUrl"

try {
  Resolve-DnsName ([Uri]$normalizedUrl).Host -ErrorAction Stop | Out-Null
} catch {
  throw "Supabase-Domain ist nicht erreichbar: $(([Uri]$normalizedUrl).Host). Prüfe die Project URL in Supabase."
}

$env:VITE_APP_ENV = "development"
$env:PADDLIO_SEED_ALLOW_DEVELOPMENT = "true"
$env:PADDLIO_DEV_SUPABASE_PROJECT_REF = $projectRef
$env:SUPABASE_URL = $normalizedUrl
$env:SUPABASE_SERVICE_ROLE_KEY = $ServiceRoleKey
$env:PADDLIO_DEV_TEST_PASSWORD = $TestPassword

npm.cmd run seed:development

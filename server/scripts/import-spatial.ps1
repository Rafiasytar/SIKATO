param(
  [string]$SourceDir = "D:\data\data spasial",
  [string]$Database = "bi_tabek_patah",
  [string]$User = "postgres",
  [string]$HostName = "localhost",
  [int]$Port = 5432,
  [int]$Srid = 4326,
  [string]$Schema = "public",
  [string]$PgBin = "C:\Program Files\PostgreSQL\17\bin",
  [string]$SevenZip = "C:\Program Files\7-Zip\7z.exe",
  [string]$Password = $env:PGPASSWORD
)

$ErrorActionPreference = "Stop"
$hadPasswordEnv = [bool]$env:PGPASSWORD

function ConvertTo-SafeTableName {
  param([string]$Name)

  $safeName = $Name.ToLowerInvariant()
  $safeName = $safeName -replace "[^a-z0-9]+", "_"
  $safeName = $safeName.Trim("_")

  if (-not $safeName) {
    return "layer_spasial"
  }

  return $safeName
}

if (-not (Test-Path -LiteralPath $SourceDir)) {
  throw "Folder sumber tidak ditemukan: $SourceDir"
}

$psql = Join-Path $PgBin "psql.exe"
$shp2pgsql = Join-Path $PgBin "shp2pgsql.exe"

if (-not (Test-Path -LiteralPath $psql)) {
  throw "psql.exe tidak ditemukan: $psql"
}

if (-not (Test-Path -LiteralPath $shp2pgsql)) {
  throw "shp2pgsql.exe tidak ditemukan: $shp2pgsql"
}

if (-not $Password) {
  $securePassword = Read-Host "Password PostgreSQL untuk user $User" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

$env:PGPASSWORD = $Password

try {
  Write-Host "Mengaktifkan PostGIS di database $Database..."
  & $psql -v ON_ERROR_STOP=1 -h $HostName -p $Port -U $User -d $Database -c "CREATE EXTENSION IF NOT EXISTS postgis;"

$extractRoot = Join-Path $SourceDir "_mpk_extracted"

if (Test-Path -LiteralPath $SevenZip) {
  New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null

  Get-ChildItem -LiteralPath $SourceDir -File -Filter *.mpk | ForEach-Object {
    $targetDir = Join-Path $extractRoot ([IO.Path]::GetFileNameWithoutExtension($_.Name))
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

    Write-Host "Ekstrak MPK: $($_.Name)"
    & $SevenZip x $_.FullName "-o$targetDir" -y | Out-Null
  }
} else {
  Write-Warning "7z.exe tidak ditemukan. File .mpk dilewati."
}

$shapeFiles = Get-ChildItem -LiteralPath $SourceDir -Recurse -File -Filter *.shp |
  Where-Object { $_.FullName -notmatch "\\node_modules\\" }

if (-not $shapeFiles) {
  Write-Warning "Tidak ada file .shp yang ditemukan."
  exit 0
}

  foreach ($shapeFile in $shapeFiles) {
    $tableName = ConvertTo-SafeTableName $shapeFile.BaseName
    $qualifiedTable = "$Schema.$tableName"

    Write-Host "Import $($shapeFile.FullName) -> $qualifiedTable"
    & $psql -v ON_ERROR_STOP=1 -h $HostName -p $Port -U $User -d $Database -c "DROP TABLE IF EXISTS $qualifiedTable CASCADE;"

    & $shp2pgsql -I -W UTF-8 -s $Srid $shapeFile.FullName $qualifiedTable |
      & $psql -v ON_ERROR_STOP=1 -h $HostName -p $Port -U $User -d $Database
  }

  Write-Host "Selesai import data spasial."
} finally {
  if (-not $hadPasswordEnv) {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }
}

# Stop hook: pide actualizar .claude/PROGRESS.md una vez por sesión.
# Marker por session_id evita bucle: Claude actualiza, vuelve a parar,
# el marker ya existe, exit 0 -> stop real.

$ErrorActionPreference = 'Stop'

$raw = [Console]::In.ReadToEnd()
try {
    $data = $raw | ConvertFrom-Json
    $sessionId = if ($data.session_id) { $data.session_id } else { 'unknown' }
} catch {
    $sessionId = 'unknown'
}

$markerDir = Join-Path '.claude' '.progress-markers'
$marker = Join-Path $markerDir $sessionId

if (-not (Test-Path $markerDir)) {
    New-Item -ItemType Directory -Path $markerDir -Force | Out-Null
}

if (Test-Path $marker) {
    exit 0
}

New-Item -ItemType File -Path $marker -Force | Out-Null

$reason = 'Antes de cerrar la sesion, agrega una entrada al inicio de .claude/PROGRESS.md con la fecha de hoy (YYYY-MM-DD) y 3-5 vinetas del trabajo de esta sesion: que cambio, por que, y que quedo pendiente. Si no hubo cambios materiales en codigo, escribe solo "Sin cambios materiales" como unica vineta. No expliques en el chat lo que estas haciendo, solo edita el archivo y termina.'

$payload = @{ decision = 'block'; reason = $reason } | ConvertTo-Json -Compress
Write-Output $payload

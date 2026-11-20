# Convert the generated Dropbox preview cache into compact JPEG derivatives.
# Originals remain untouched on Dropbox. Run only after import-dropbox.mjs finishes.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$assetRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'assets'))
$catalogPath = Join-Path $PSScriptRoot 'catalog.json'
$items = Get-Content -LiteralPath $catalogPath -Raw -Encoding UTF8 | ConvertFrom-Json
$encoder = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$parameters = [Drawing.Imaging.EncoderParameters]::new(1)
$parameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, [long]82)
$oldPaths = [Collections.Generic.HashSet[string]]::new()
$gamePositions = @{}
$count = 0
foreach ($item in $items) {
  if ($item.id -notmatch '^[a-f0-9]{18}$') { throw 'Unexpected catalog id' }
  $gamePositions[$item.game] = 1 + $gamePositions[$item.game]
  $displayName = [IO.Path]::GetFileNameWithoutExtension($item.filename) -replace '_+', ' ' -replace '\s+', ' '
  $randomShortName = $displayName -cmatch '^[A-Za-z0-9]{7}$' -and $displayName.Substring(1) -cmatch '[A-Z]' -and $displayName -cnotmatch '^[A-Z]+$'
  if ($randomShortName -or $displayName -match '^[a-f0-9]{8}-[a-f0-9]{4}-' -or $displayName -match '\d{1,2} \d{1,2} 20\d{2}|\d{1,2}/\d{1,2}/20\d{2}') {
    $item.title = '{0} {1} {2:00}' -f $item.game, [char]0x00B7, $gamePositions[$item.game]
  }
  if ($item.previewOptimized -and $item.previewOptimizationVersion -eq 2) { $count++; continue }
  foreach ($kind in @('thumbnail', 'preview')) {
    $sourceName = [IO.Path]::GetFileName($item.$kind)
    $sourcePath = [IO.Path]::GetFullPath((Join-Path $assetRoot $sourceName))
    if (-not $sourcePath.StartsWith($assetRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'Cache path escaped assets directory' }
    $suffix = if ($kind -eq 'thumbnail') { 'thumb' } else { 'preview' }
    $targetName = $item.id + '-' + $suffix + '.jpg'
    $targetPath = [IO.Path]::GetFullPath((Join-Path $assetRoot $targetName))
    $tempPath = $targetPath + '.optimizing.jpg'
    $maxEdge = if ($kind -eq 'thumbnail') { 800 } else { 1600 }
    $source = [Drawing.Image]::FromFile($sourcePath)
    try {
      if ($source.Width -lt 16 -or $source.Height -lt 16) { throw "Invalid cached source dimensions: $sourceName" }
      $scale = [Math]::Min([double]1.0, [double]$maxEdge / [double][Math]::Max($source.Width, $source.Height))
      $width = [Math]::Max(1, [int][Math]::Round($source.Width * $scale))
      $height = [Math]::Max(1, [int][Math]::Round($source.Height * $scale))
      $bitmap = [Drawing.Bitmap]::new($width, $height)
      try {
        $graphics = [Drawing.Graphics]::FromImage($bitmap)
        try {
          $graphics.Clear([Drawing.Color]::Black)
          $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
          $graphics.DrawImage($source, 0, 0, $width, $height)
        } finally { $graphics.Dispose() }
        if ($width -lt 16 -or $height -lt 16 -or [Math]::Max($width, $height) -gt $maxEdge) { throw "Invalid preview size: $targetName" }
        $bitmap.Save($tempPath, $encoder, $parameters)
        $verified = [Drawing.Image]::FromFile($tempPath)
        try { if ($verified.Width -ne $width -or $verified.Height -ne $height) { throw "Encoded dimensions do not match: $targetName" } } finally { $verified.Dispose() }
      } finally { $bitmap.Dispose() }
    } finally { $source.Dispose() }
    Move-Item -LiteralPath $tempPath -Destination $targetPath -Force
    $item.$kind = '/wallpapers/assets/' + $targetName
    if ($sourcePath -ne $targetPath) { [void]$oldPaths.Add($sourcePath) }
  }
  $item | Add-Member -NotePropertyName previewOptimized -NotePropertyValue $true -Force
  $item | Add-Member -NotePropertyName previewOptimizationVersion -NotePropertyValue 2 -Force
  $count++
  if ($count % 100 -eq 0) { Write-Output "Optimized $count wallpapers" }
}
# Publish links before deleting only generated, now-unreferenced derivative files.
$utf8 = [Text.UTF8Encoding]::new($false)
$nextCatalogPath = $catalogPath + '.optimizing'
[IO.File]::WriteAllText($nextCatalogPath, ($items | ConvertTo-Json -Depth 6) + [Environment]::NewLine, $utf8)
Move-Item -LiteralPath $nextCatalogPath -Destination $catalogPath -Force
foreach ($oldPath in $oldPaths) { Remove-Item -LiteralPath $oldPath }
$parameters.Dispose()
Write-Output "Optimized $count wallpapers; original downloads preserved."

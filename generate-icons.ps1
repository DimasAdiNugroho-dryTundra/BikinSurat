New-Item -ItemType Directory -Force -Path 'src-tauri/icons'
Add-Type -AssemblyName System.Drawing

$sizes = @(32, 128)
foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $sz, $sz
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(99, 102, 241))
    $bmp.Save("src-tauri/icons/$($sz)x$($sz).png", [System.Drawing.Imaging.ImageFormat]::Png)
    if ($sz -eq 128) {
        $bmp.Save("src-tauri/icons/128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)
    }
}

$bmp32 = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp32)
$g.Clear([System.Drawing.Color]::FromArgb(99, 102, 241))
$hIcon = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fileStream = New-Object System.IO.FileStream('src-tauri/icons/icon.ico', [System.IO.FileMode]::Create)
$icon.Save($fileStream)
$fileStream.Close()

Copy-Item 'src-tauri/icons/128x128.png' 'src-tauri/icons/icon.icns' -Force
Write-Host "Icons generated successfully!"


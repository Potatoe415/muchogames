Add-Type -AssemblyName System.Drawing
$srcPath = 'C:\Users\rfaucompret\.cursor\projects\c-Users-rfaucompret-Documents-DEV-dev-projects-muchogames\assets\c__Users_rfaucompret_AppData_Roaming_Cursor_User_workspaceStorage_12fb64748c38334bcb8bbc4e45602932_images_Gemini_Generated_Image_po2chcpo2chcpo2c-be125e3c-bf60-4982-8617-c65b0acdd310.jpg'
$bmp = New-Object System.Drawing.Bitmap($srcPath)
$bg = $bmp.GetPixel(5, 5)
$x = 592
for ($y = 340; $y -le 400; $y += 2) {
    $p = $bmp.GetPixel($x, $y)
    $d = [Math]::Abs([int]$p.R - [int]$bg.R) + [Math]::Abs([int]$p.G - [int]$bg.G) + [Math]::Abs([int]$p.B - [int]$bg.B)
    Write-Output ("y=$y diff=$d rgb=$($p.R),$($p.G),$($p.B)")
}
$bmp.Dispose()

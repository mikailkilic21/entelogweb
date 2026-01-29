Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$InputFile,
        [string]$OutputFile,
        [int]$TargetSize,
        [bool]$SquareCanvas = $true
    )

    if (-not (Test-Path $InputFile)) {
        Write-Error "Input file not found: $InputFile"
        return
    }

    try {
        $srcImage = [System.Drawing.Image]::FromFile($InputFile)
        $srcWidth = $srcImage.Width
        $srcHeight = $srcImage.Height

        # Calculate new dimensions to fit WITHIN TargetSize (Aspect Ratio Preserved)
        $ratioX = $TargetSize / $srcWidth
        $ratioY = $TargetSize / $srcHeight
        $ratio = [Math]::Min($ratioX, $ratioY)

        $newWidth = [int]($srcWidth * $ratio)
        $newHeight = [int]($srcHeight * $ratio)

        # Determine Canvas Dimensions
        $canvasWidth = if ($SquareCanvas) { $TargetSize } else { $newWidth }
        $canvasHeight = if ($SquareCanvas) { $TargetSize } else { $newHeight }

        # Calculate Centering Position
        $posX = [int](($canvasWidth - $newWidth) / 2)
        $posY = [int](($canvasHeight - $newHeight) / 2)

        # Create new bitmap (Canvas)
        $newImage = new-object System.Drawing.Bitmap $canvasWidth, $canvasHeight
        $graphics = [System.Drawing.Graphics]::FromImage($newImage)
        
        # High quality settings
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        # Clear with transparency
        $graphics.Clear([System.Drawing.Color]::Transparent)

        # Draw image centered
        $graphics.DrawImage($srcImage, $posX, $posY, $newWidth, $newHeight)
        
        # Save as PNG
        $newImage.Save($OutputFile, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Cleanup
        $graphics.Dispose()
        $newImage.Dispose()
        $srcImage.Dispose()
        
        Write-Host "✅ Success: Resized $InputFile to $OutputFile (Canvas: $canvasWidth x $canvasHeight, Image: $newWidth x $newHeight)"
    }
    catch {
        Write-Error "❌ Error processing $InputFile : $_"
    }
}

# Paths
$MobileAssets = "d:\EntelogWeb\mobile\assets\images"

# Resize White Logo (Splash) - Enforce Square 1024x1024
Resize-Image `
    -InputFile "$MobileAssets\beyazlogo.png" `
    -OutputFile "$MobileAssets\beyazlogo_opt.png" `
    -TargetSize 1024 `
    -SquareCanvas $true

# Resize Black Logo (Icon) - Enforce Square 1024x1024
Resize-Image `
    -InputFile "$MobileAssets\siyahlogo.png" `
    -OutputFile "$MobileAssets\siyahlogo_opt.png" `
    -TargetSize 1024 `
    -SquareCanvas $true

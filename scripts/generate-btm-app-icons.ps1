Add-Type -AssemblyName System.Drawing

$root = "C:\Users\Emmanuel\Documents\PROJECTS\kingdomconnect"
$outputDir = Join-Path $root "mobile\assets\images"

function New-Bitmap {
    param([int]$size)
    return New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function New-Graphics {
    param([System.Drawing.Bitmap]$bitmap)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    return $graphics
}

function Save-Png {
    param(
        [System.Drawing.Bitmap]$bitmap,
        [string]$path
    )
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-RoundedRectPath([float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
    $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
    $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-Background {
    param([System.Drawing.Graphics]$graphics, [float]$size)

    $outerPath = New-RoundedRectPath 0 0 $size $size ($size * 0.24)
    $deepRed = [System.Drawing.Color]::FromArgb(255, 120, 6, 24)
    $red = [System.Drawing.Color]::FromArgb(255, 214, 18, 48)
    $darkRed = [System.Drawing.Color]::FromArgb(255, 78, 4, 15)
    $gold = [System.Drawing.Color]::FromArgb(255, 243, 193, 63)

    $baseBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($outerPath)
    $baseBrush.CenterColor = $red
    $baseBrush.SurroundColors = [System.Drawing.Color[]]@($deepRed)
    $graphics.FillPath($baseBrush, $outerPath)
    $baseBrush.Dispose()

    $topGlow = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(0, 0)),
        (New-Object System.Drawing.PointF(0, $size)),
        [System.Drawing.Color]::FromArgb(42, 255, 255, 255),
        [System.Drawing.Color]::FromArgb(0, 255, 255, 255)
    )
    $graphics.FillPath($topGlow, $outerPath)
    $topGlow.Dispose()

    $lowerShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, $darkRed))
    $graphics.FillEllipse($lowerShadow, [float]($size * 0.08), [float]($size * 0.50), [float]($size * 0.84), [float]($size * 0.36))
    $lowerShadow.Dispose()

    $ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, $gold), [float]($size * 0.015))
    $ringPen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Inset
    $graphics.DrawPath($ringPen, $outerPath)
    $ringPen.Dispose()
    $outerPath.Dispose()
}

function Draw-AccentMark {
    param([System.Drawing.Graphics]$graphics, [float]$size)

    $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 243, 193, 63))
    $goldPoints = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF([float]($size * 0.34), [float]($size * 0.16))),
        (New-Object System.Drawing.PointF([float]($size * 0.48), [float]($size * 0.16))),
        (New-Object System.Drawing.PointF([float]($size * 0.61), [float]($size * 0.41))),
        (New-Object System.Drawing.PointF([float]($size * 0.47), [float]($size * 0.41)))
    )
    $graphics.FillPolygon($goldBrush, $goldPoints)
    $goldBrush.Dispose()

    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 86, 116))
    $redPoints = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF([float]($size * 0.48), [float]($size * 0.18))),
        (New-Object System.Drawing.PointF([float]($size * 0.66), [float]($size * 0.18))),
        (New-Object System.Drawing.PointF([float]($size * 0.57), [float]($size * 0.31))),
        (New-Object System.Drawing.PointF([float]($size * 0.39), [float]($size * 0.31)))
    )
    $graphics.FillPolygon($redBrush, $redPoints)
    $redBrush.Dispose()
}

function Draw-BTMText {
    param(
        [System.Drawing.Graphics]$graphics,
        [float]$size,
        [bool]$compact
    )

    $textColor = [System.Drawing.Color]::FromArgb(255, 255, 252, 247)
    $shadowColor = [System.Drawing.Color]::FromArgb(130, 58, 0, 10)
    $fontSize = if ($compact) { [float]($size * 0.25) } else { [float]($size * 0.27) }
    $top = if ($compact) { [float]($size * 0.37) } else { [float]($size * 0.34) }
    $height = if ($compact) { [float]($size * 0.24) } else { [float]($size * 0.26) }

    $font = New-Object System.Drawing.Font("Segoe UI Black", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoClip

    $shadowBrush = New-Object System.Drawing.SolidBrush($shadowColor)
    $textBrush = New-Object System.Drawing.SolidBrush($textColor)

    $shadowRect = New-Object System.Drawing.RectangleF([float]($size * 0.06), [float]($top + ($size * 0.010)), [float]($size * 0.88), $height)
    $textRect = New-Object System.Drawing.RectangleF([float]($size * 0.06), $top, [float]($size * 0.88), $height)
    $graphics.DrawString("BTM", $font, $shadowBrush, $shadowRect, $format)
    $graphics.DrawString("BTM", $font, $textBrush, $textRect, $format)

    $textBrush.Dispose()
    $shadowBrush.Dispose()
    $font.Dispose()
    $format.Dispose()
}

function Draw-MonochromeMark {
    param([System.Drawing.Graphics]$graphics, [float]$size)

    $graphics.Clear([System.Drawing.Color]::Transparent)
    $white = [System.Drawing.Color]::White

    $accentBrush = New-Object System.Drawing.SolidBrush($white)
    $accentPoints1 = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF([float]($size * 0.33), [float]($size * 0.16))),
        (New-Object System.Drawing.PointF([float]($size * 0.47), [float]($size * 0.16))),
        (New-Object System.Drawing.PointF([float]($size * 0.59), [float]($size * 0.38))),
        (New-Object System.Drawing.PointF([float]($size * 0.45), [float]($size * 0.38)))
    )
    $graphics.FillPolygon($accentBrush, $accentPoints1)
    $accentPoints2 = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF([float]($size * 0.47), [float]($size * 0.18))),
        (New-Object System.Drawing.PointF([float]($size * 0.67), [float]($size * 0.18))),
        (New-Object System.Drawing.PointF([float]($size * 0.57), [float]($size * 0.31))),
        (New-Object System.Drawing.PointF([float]($size * 0.38), [float]($size * 0.31)))
    )
    $graphics.FillPolygon($accentBrush, $accentPoints2)
    $accentBrush.Dispose()

    $font = New-Object System.Drawing.Font("Segoe UI Black", [float]($size * 0.24), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $brush = New-Object System.Drawing.SolidBrush($white)
    $textRect = New-Object System.Drawing.RectangleF([float]($size * 0.10), [float]($size * 0.36), [float]($size * 0.80), [float]($size * 0.24))
    $graphics.DrawString("BTM", $font, $brush, $textRect, $format)
    $brush.Dispose()
    $font.Dispose()
    $format.Dispose()
}

function Draw-IconSet {
    param(
        [int]$size,
        [string]$targetPath,
        [string]$mode
    )

    $bitmap = New-Bitmap $size
    $graphics = New-Graphics $bitmap

    switch ($mode) {
        "icon" {
            Draw-Background $graphics $size
            Draw-AccentMark $graphics $size
            Draw-BTMText $graphics $size $false
        }
        "foreground" {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            Draw-AccentMark $graphics $size
            Draw-BTMText $graphics $size $true
        }
        "background" {
            Draw-Background $graphics $size
        }
        "monochrome" {
            Draw-MonochromeMark $graphics $size
        }
        "favicon" {
            Draw-Background $graphics $size
            Draw-AccentMark $graphics $size
            Draw-BTMText $graphics $size $true
        }
    }

    Save-Png $bitmap $targetPath
    $graphics.Dispose()
    $bitmap.Dispose()
}

Draw-IconSet 1024 (Join-Path $outputDir "btm-app-icon.png") "icon"
Draw-IconSet 1024 (Join-Path $outputDir "btm-splash-icon.png") "icon"
Draw-IconSet 432 (Join-Path $outputDir "btm-android-icon-foreground.png") "foreground"
Draw-IconSet 432 (Join-Path $outputDir "btm-android-icon-background.png") "background"
Draw-IconSet 432 (Join-Path $outputDir "btm-android-icon-monochrome.png") "monochrome"
Draw-IconSet 64 (Join-Path $outputDir "btm-favicon.png") "favicon"

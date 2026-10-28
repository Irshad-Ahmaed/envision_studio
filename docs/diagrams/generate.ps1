# Regenerate the local documentation diagrams on Windows with .NET System.Drawing.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function New-Diagram {
    param([string]$Name, [string]$Title, [string[]]$Lines)
    $width = 1080
    $height = 105 + ($Lines.Count * 98)
    $bitmap = [System.Drawing.Bitmap]::new($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $background = [System.Drawing.ColorTranslator]::FromHtml('#0C0D10')
    $surface = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#17191F'))
    $textBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#F1F2F5'))
    $accent = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#A99BFF'))
    $border = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#444957'), 2)
    $titleFont = [System.Drawing.Font]::new('Segoe UI', 23, [System.Drawing.FontStyle]::Bold)
    $bodyFont = [System.Drawing.Font]::new('Segoe UI', 18)
    $arrowFont = [System.Drawing.Font]::new('Segoe UI', 17, [System.Drawing.FontStyle]::Bold)
    try {
        $graphics.Clear($background)
        $graphics.DrawString($Title, $titleFont, $textBrush, 36, 22)
        for ($i = 0; $i -lt $Lines.Count; $i++) {
            $y = 82 + ($i * 98)
            $graphics.FillRectangle($surface, 36, $y, 1008, 62)
            $graphics.DrawRectangle($border, 36, $y, 1008, 62)
            $graphics.DrawString($Lines[$i], $bodyFont, $textBrush, 55, ($y + 13))
            if ($i -lt $Lines.Count - 1) { $graphics.DrawString([string][char]0x2193, $arrowFont, $accent, 526, ($y + 62)) }
        }
        $bitmap.Save((Join-Path $PSScriptRoot ($Name + '.png')), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose(); $bitmap.Dispose(); $surface.Dispose(); $textBrush.Dispose()
        $accent.Dispose(); $border.Dispose(); $titleFont.Dispose(); $bodyFont.Dispose(); $arrowFont.Dispose()
    }
}

New-Diagram 'system-overview' 'System overview' @(
    'Reviewer browser: pages, forms and React Query',
    'HTTPS / same-origin JSON -> Next.js REST route handlers',
    'Request validation and security guards',
    'Project, task and dashboard services',
    'Mongoose models and MongoDB Atlas'
)
New-Diagram 'data-model' 'Project and task relationship' @(
    'Project: id, title, description, status, deadline',
    'One project has zero or more tasks',
    'Task: id, projectId, title, completed',
    'projectId identifies the parent project'
)
New-Diagram 'delete-flow' 'Project deletion flow' @(
    'User confirms deletion of a project and its tasks',
    'API starts a MongoDB transaction',
    'Delete the project, then its associated tasks',
    'Commit transaction and return success',
    'Refresh the project list and dashboard'
)
New-Diagram 'navigation' 'Navigation and primary flows' @(
    'Dashboard -> Projects list and status filter',
    'Project name -> Edit form; View details -> Project detail',
    'Project detail -> Edit project or manage tasks',
    'Project detail -> Confirm delete -> Projects list'
)
New-Diagram 'seed-flow' 'Seed import and recovery' @(
    'Validate the supplied fixture and checksum',
    'Check database, checksum and import manifest',
    'New or incomplete -> guarded import; complete -> no-op',
    'Verify records and relationships; mark import complete',
    'Share the public URL after the import is verified'
)

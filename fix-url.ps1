$filePath = ".\src\App.jsx"
$content = Get-Content $filePath -Raw

$apiBaseUrlConst = "`nconst API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.protocol + '//' + window.location.hostname + ':3000');`n"

# Insert the API_BASE_URL after the last import statement
$importEndIndex = $content.LastIndexOf("import ")
$nextNewLine = $content.IndexOf("`n", $importEndIndex)
$content = $content.Substring(0, $nextNewLine + 1) + $apiBaseUrlConst + $content.Substring($nextNewLine + 1)

# Replace 'http://localhost:3000/...' with `${API_BASE_URL}/...`
$content = [System.Text.RegularExpressions.Regex]::Replace($content, "'http://localhost:3000([^']*)'", '`${API_BASE_URL}$1`')

# Replace `http://localhost:3000/...` with `${API_BASE_URL}/...`
$content = [System.Text.RegularExpressions.Regex]::Replace($content, "``http://localhost:3000([^``]+)``", '`${API_BASE_URL}$1`')

Set-Content $filePath $content -NoNewline
Write-Host "App.jsx updated successfully."

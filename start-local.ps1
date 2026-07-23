# ZUTERE AUDIOVISUAL - LOCAL HTTP DEV SERVER
$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
} catch {
    $port = 3001
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
}

$url = "http://127.0.0.1:$port/"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "🚀 ZUTERE AUDIOVISUAL - SERVIDOR LOCAL RODANDO!" -ForegroundColor Cyan
Write-Host "   URL Principal: $url" -ForegroundColor Yellow
Write-Host "   Painel Admin:  http://127.0.0.1:$port/admin" -ForegroundColor Yellow
Write-Host "   Orçamentos:    http://127.0.0.1:$port/orcamento" -ForegroundColor Yellow
Write-Host "==========================================================`n" -ForegroundColor Green

# Abre o navegador automaticamente
Start-Process $url

$rootPath = Get-Location

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawPath = $request.Url.AbsolutePath
        
        # API Routes Handling for Local PowerShell Server
        if ($rawPath.StartsWith('/api/')) {
            $response.ContentType = 'application/json; charset=utf-8'
            $apiResponse = '{"success":true,"data":null,"localFallback":true}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($apiResponse)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # Clean URLs route mapping
        if ($rawPath -eq '/' -or $rawPath -eq '') {
            $filePath = Join-Path $rootPath 'index.html'
        } elseif ($rawPath -eq '/admin') {
            $filePath = Join-Path $rootPath 'admin.html'
        } elseif ($rawPath -eq '/orcamento') {
            $filePath = Join-Path $rootPath 'orcamento.html'
        } else {
            $filePath = Join-Path $rootPath $rawPath.TrimStart('/')
            if (-not (Test-Path $filePath) -and (Test-Path "$filePath.html")) {
                $filePath = "$filePath.html"
            }
        }

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Content Type Mapping
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($ext) {
                '.html' { $response.ContentType = 'text/html; charset=utf-8' }
                '.css'  { $response.ContentType = 'text/css; charset=utf-8' }
                '.js'   { $response.ContentType = 'application/javascript; charset=utf-8' }
                '.png'  { $response.ContentType = 'image/png' }
                '.jpg'  { $response.ContentType = 'image/jpeg' }
                '.jpeg' { $response.ContentType = 'image/jpeg' }
                '.webp' { $response.ContentType = 'image/webp' }
                '.mp4'  { $response.ContentType = 'video/mp4' }
                '.json' { $response.ContentType = 'application/json; charset=utf-8' }
                default { $response.ContentType = 'application/octet-stream' }
            }

            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        $response.Close()
    } catch {
        # ignore context errors on loop stop
    }
}

<?php

/**
 * Laravel - A PHP Framework For Web Artisans
 *
 * @package  Laravel
 * @author   Taylor Otwell <taylor@laravel.com>
 */

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? ''
);

$filePath = __DIR__ . '/public' . $uri;

// This file emulates Apache's "mod_rewrite" functionality.
// If the file exists in the public directory, serve it directly with the correct Content-Type header.
if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    
    $mimeTypes = [
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
        'otf'  => 'font/otf',
        'json' => 'application/json',
    ];
    
    $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
    header("Content-Type: $mimeType");
    readfile($filePath);
    exit;
}

require_once __DIR__.'/public/index.php';

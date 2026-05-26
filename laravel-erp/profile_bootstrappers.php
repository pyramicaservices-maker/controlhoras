<?php
define('LARAVEL_START', microtime(true));

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$bootstrappers = [
    \Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables::class,
    \Illuminate\Foundation\Bootstrap\LoadConfiguration::class,
    \Illuminate\Foundation\Bootstrap\HandleExceptions::class,
    \Illuminate\Foundation\Bootstrap\RegisterFacades::class,
    \Illuminate\Foundation\Bootstrap\RegisterProviders::class,
    \Illuminate\Foundation\Bootstrap\BootProviders::class,
];

foreach ($bootstrappers as $bootstrapper) {
    $start = microtime(true);
    $app->make($bootstrapper)->bootstrap($app);
    $time = microtime(true) - $start;
    echo "Bootstrapper " . basename(str_replace('\\', '/', $bootstrapper)) . ": " . round($time, 4) . "s\n";
}

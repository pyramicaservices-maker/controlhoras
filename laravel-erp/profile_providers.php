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
];

foreach ($bootstrappers as $bootstrapper) {
    $app->make($bootstrapper)->bootstrap($app);
}

// Access protected methods via reflection
$reflection = new ReflectionClass($app);
$bootProvider = $reflection->getMethod('bootProvider');
$bootProvider->setAccessible(true);

$providersProperty = $reflection->getProperty('serviceProviders');
$providersProperty->setAccessible(true);
$providers = $providersProperty->getValue($app);

echo "Total providers to boot: " . count($providers) . "\n";
foreach ($providers as $provider) {
    $class = get_class($provider);
    $start = microtime(true);
    $bootProvider->invoke($app, $provider);
    $time = microtime(true) - $start;
    if ($time > 0.005) { // Show any provider taking > 5ms
        echo "Provider {$class}: " . round($time, 4) . "s\n";
    }
}

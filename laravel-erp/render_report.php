<?php
define('LARAVEL_START', microtime(true));

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use Illuminate\Http\Request;
use App\Models\User;

$t1 = microtime(true);
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();
$t2 = microtime(true);
echo "Kernel Bootstrap Time: " . round($t2 - $t1, 4) . "s\n";

$t3 = microtime(true);
$request = Request::create('http://localhost:8000/admin/time-report', 'GET');
$app->instance('request', $request);
$user = User::where('role', 'admin')->first();
auth()->login($user);
$t4 = microtime(true);
echo "Auth & Login Time: " . round($t4 - $t3, 4) . "s\n";

$t5 = microtime(true);
$response = $kernel->handle($request);
$t6 = microtime(true);
echo "Request Handle Time: " . round($t6 - $t5, 4) . "s\n";

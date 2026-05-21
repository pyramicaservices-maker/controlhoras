<?php
$s = microtime(true);
try {
    $p = new PDO("mysql:host=mysql;dbname=laravel", "sail", "password");
    echo "OK: " . (microtime(true) - $s);
} catch(Exception $e) {
    echo "ERR: " . $e->getMessage();
}

<?php
$s = microtime(true);
file_put_contents('storage/logs/test.log', 'test');
echo "OK: " . (microtime(true) - $s);

<?php
declare(strict_types=1);
require __DIR__.'/../views/headers.php';
header('Content-Type: text/html; charset=utf-8');
readfile(__DIR__.'/../HUONG-DAN.html');

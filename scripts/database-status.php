<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../src/bootstrap.php';
try {
    $c=config();
    $status=['host'=>$c['host'],'port'=>(int)$c['port'],'database'=>$c['database'],'connected'=>false];
    try { db()->query('SELECT 1'); $status['connected']=true; } catch(Throwable $e) { /* no password or PDO details on stdout */ }
    echo json_encode($status,JSON_UNESCAPED_UNICODE);exit($status['connected']?0:1);
} catch(Throwable $e) { fwrite(STDERR,'Khong doc duoc config.local.php.'.PHP_EOL);exit(2); }

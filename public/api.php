<?php
declare(strict_types=1);
require __DIR__.'/../src/bootstrap.php';
require __DIR__.'/../src/Api.php';
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
try {
    boot_session();
    api_dispatch($_GET['action']??'',$_SERVER['REQUEST_METHOD']);
} catch(Throwable $e) {
    try { if (isset($_SESSION['uid']) && db()->inTransaction()) db()->rollBack(); } catch(Throwable) {}
    $status=$e instanceof ApiError?$e->status:500;
    if($status===500) error_log((string)$e);
    http_response_code($status); header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok'=>false,'error'=>$status===500?'Không thực hiện được yêu cầu. Kiểm tra kết nối MySQL và nhật ký máy chủ.':$e->getMessage()],JSON_UNESCAPED_UNICODE);
}

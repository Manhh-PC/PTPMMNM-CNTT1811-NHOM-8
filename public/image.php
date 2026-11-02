<?php
declare(strict_types=1);
require __DIR__.'/../src/bootstrap.php';
try {
    boot_session(); $u=user(); $v=version_access(idval($_GET['id']??0),$u);
    session_write_close();
    $name=$v['filename'];
    if(!preg_match('/^[a-zA-Z0-9_-]+\.(png|jpg)$/',$name)) fail(404,'Không tìm thấy ảnh.');
    $path=ROOT.'/storage/uploads/'.$name;
    if(!is_file($path)) fail(404,'Tệp ảnh không còn tồn tại.');
    header('Content-Type: '.$v['mime_type']); header('X-Content-Type-Options: nosniff'); header('Cache-Control: private, no-store');
    header('Content-Length: '.filesize($path));
    if(isset($_GET['download'])) header("Content-Disposition: attachment; filename*=UTF-8''".rawurlencode($v['original_name']));
    readfile($path);
} catch(Throwable $e) {
    http_response_code($e instanceof ApiError?$e->status:500); header('Content-Type: text/plain; charset=utf-8');
    echo $e instanceof ApiError?$e->getMessage():'Không tải được ảnh.';
}

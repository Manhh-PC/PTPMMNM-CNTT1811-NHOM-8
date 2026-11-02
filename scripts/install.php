<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__.'/../src/bootstrap.php';

try {
    foreach (['pdo_mysql','mbstring','fileinfo'] as $extension) {
        if (!extension_loaded($extension)) throw new RuntimeException('Thiếu PHP extension '.$extension);
    }
    $create = in_array('--schema', $argv, true);
    $demo = in_array('--demo', $argv, true);
    if (!$create && !$demo) {
        echo "Dùng --schema để khởi tạo các bảng trong database trống, hoặc --demo để nạp dữ liệu mẫu.\n";
        exit(1);
    }
    if ($create) {
        if (one('SHOW TABLES')) throw new RuntimeException('Database đã có bảng. Xem mục nâng cấp trong HUONG-DAN.html.');
        db()->exec(file_get_contents(ROOT.'/database/schema.sql'));
        echo "Đã tạo bảng.\n";
    }
    if ($demo) {
        require_admin_schema();
        require __DIR__.'/seed.php';
        seed_demo();
    }
} catch (Throwable $error) {
    try { if (db()->inTransaction()) db()->rollBack(); } catch (Throwable) {}
    fwrite(STDERR, 'Cài đặt chưa hoàn tất. '.$error->getMessage().PHP_EOL);
    exit(1);
}

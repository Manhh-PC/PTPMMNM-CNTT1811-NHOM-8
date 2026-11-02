<?php
declare(strict_types=1);

const ROOT = __DIR__ . '/..';
date_default_timezone_set('Asia/Ho_Chi_Minh');
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', ROOT . '/storage/logs/php.log');

final class ApiError extends RuntimeException {
    public function __construct(public int $status, string $message) { parent::__construct($message);
    }
}

function config(): array {
    static $config;
    if ($config === null) {
        if (!is_file(ROOT . '/config.local.php')) throw new ApiError(503, 'Chưa cấu hình cơ sở dữ liệu. Hãy tạo config.local.php theo hướng dẫn cài đặt.');
        $config = require ROOT . '/config.local.php';
    }
    return $config;
}
function db(): PDO {
    static $pdo;
    if (!$pdo) {
        $c = config();
        $pdo = new PDO("mysql:host={$c['host']};port={$c['port']};dbname={$c['database']};charset=utf8mb4", $c['username'], $c['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec("SET time_zone = '+07:00'");
    }
    return $pdo;
}
function sql(string $query, array $params = []): PDOStatement {
    $q = db()->prepare($query);
    $q->execute($params);
    return $q;
}
function one(string $query, array $params = []): ?array { return sql($query, $params)->fetch() ?: null;
}
function all(string $query, array $params = []): array { return sql($query, $params)->fetchAll();
}
function fail(int $status, string $message): never { throw new ApiError($status, $message);
}
function respond(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function boot_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $sessionDir=ROOT.'/storage/sessions';
    if(!is_dir($sessionDir) && !mkdir($sessionDir,0700,true)) throw new ApiError(503,'Không tạo được thư mục phiên đăng nhập.');
    session_save_path($sessionDir);
    session_name('pixelnote_session');
    ini_set('session.use_strict_mode', '1');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => is_file(ROOT . '/config.local.php') && (config()['secure_cookies'] ?? false), 'httponly' => true, 'samesite' => 'Lax']);
    if(!session_start()) throw new ApiError(503,'Không lưu được phiên đăng nhập. Kiểm tra quyền ghi storage/sessions.');
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}
function user(): array {
    if (empty($_SESSION['uid'])) fail(401, 'Vui lòng đăng nhập để tiếp tục.');
    require_admin_schema();
    $u = one('SELECT id,name,email,created_at,system_role,is_active,auth_version FROM users WHERE id=?', [$_SESSION['uid']]);
    if (!$u) { unset($_SESSION['uid']);
    fail(401, 'Phiên đăng nhập đã hết hạn.');
    }
    if (!(int)$u['is_active'] || (int)($_SESSION['auth_version']??0)!==(int)$u['auth_version']) {
        unset($_SESSION['uid'],$_SESSION['auth_version']);
        fail(401, 'Tài khoản đã bị khóa hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    unset($u['auth_version']);
    return $u;
}
function require_admin_schema(): void {
    static $ready=false;
    if($ready) return;
    try {
        db()->query('SELECT system_role,is_active,auth_version FROM users LIMIT 0');
        db()->query('SELECT admin_locked FROM projects LIMIT 0');
        db()->query('SELECT id FROM admin_guard WHERE id=1')->fetchColumn() ?: throw new RuntimeException('Missing admin guard');
        db()->query('SELECT id FROM admin_audit_log LIMIT 0');
    } catch(Throwable $e) {
        if($e instanceof PDOException && !in_array($e->getCode(),['42S22','42S02'],true)) throw $e;
        fail(503, 'Cần nâng cấp database: chạy database/migrations/001-admin.sql bằng MySQL Workbench. Xem HUONG-DAN.html.');
    }
    try {
        db()->query('SELECT display_number FROM threads LIMIT 0');
        db()->query('SELECT next_note_number FROM versions LIMIT 0');
    } catch (PDOException $e) {
        if ($e->getCode() !== '42S22') throw $e;
        fail(503, 'Hãy nâng cấp bộ đếm góp ý bằng database/migrations/002-stable-numbers.sql.');
    }
    try {
        db()->query('SELECT deleted_at FROM users LIMIT 0');
        db()->query('SELECT project_id FROM invitations LIMIT 0');
    } catch (PDOException $e) {
        if (!in_array($e->getCode(),['42S22','42S02'],true)) throw $e;
        fail(503, 'Hãy nâng cấp database bằng database/migrations/003-invitations.sql.');
    }
    $ready=true;
}
function csrf(): void {
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['_csrf'] ?? '';
    if (!is_string($sent) || !hash_equals($_SESSION['csrf'], $sent)) fail(403, 'Phiên bảo mật đã thay đổi. Hãy tải lại trang và thử lại.');
}
function input(): array {
    if (str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
        try { $data = json_decode(file_get_contents('php://input'), true, 32, JSON_THROW_ON_ERROR);
        }
        catch (JsonException) { fail(422, 'Dữ liệu JSON không hợp lệ.');
        }
        if (!is_array($data)) fail(422, 'Dữ liệu không hợp lệ.');
        return $data;
    }
    return $_POST;
}
function strval_input(array $d, string $key, int $min, int $max): string {
    $v = $d[$key] ?? '';
    if (!is_string($v)) fail(422, 'Trường ' . $key . ' không hợp lệ.');
    $v = trim($v);
    $len = mb_strlen($v);
    if ($len < $min || $len > $max) fail(422, "Trường {$key} phải có từ {$min} đến {$max} ký tự.");
    return $v;
}
function idval(mixed $v): int {
    if (filter_var($v, FILTER_VALIDATE_INT) === false || (int)$v < 1) fail(422, 'Mã đối tượng không hợp lệ.');
    return (int)$v;
}
function project_access(int $id, array $u, bool $write = false, bool $owner = false): array {
    $p = one('SELECT p.*, m.role FROM projects p LEFT JOIN project_members m ON m.project_id=p.id AND m.user_id=? WHERE p.id=?', [$u['id'], $id]);
    if ($p && ($u['system_role'] ?? 'user') === 'admin') {
        $p['role'] = 'owner';
        $p['system_admin'] = true;
    } elseif ($p && $p['role'] === null) {
        $p = null;
    }
    if (!$p) fail(404, 'Không tìm thấy dự án hoặc bạn chưa được cấp quyền.');
    if ($owner && $p['role'] !== 'owner') fail(403, 'Chỉ chủ dự án có quyền thực hiện.');
    if ($write && !in_array($p['role'], ['owner','editor'], true)) fail(403, 'Bạn cần quyền chỉnh sửa để thực hiện.');
    return $p;
}
function active_project(array $p): void { if ($p['archived']) fail(409, 'Dự án đã lưu trữ. Hãy khôi phục dự án trước khi chỉnh sửa.');
}
function comment_access(array $p): void { active_project($p);
if ($p['role'] === 'viewer') fail(403, 'Tài khoản chỉ xem không được tạo hoặc chỉnh sửa góp ý.');
}
function asset_access(int $id, array $u, bool $write = false): array {
    $a = one('SELECT * FROM assets WHERE id=?', [$id]);
    if (!$a) fail(404, 'Không tìm thấy ảnh.');
    $a['project'] = project_access((int)$a['project_id'], $u, $write);
    return $a;
}
function version_access(int $id, array $u): array {
    $v = one('SELECT * FROM versions WHERE id=?', [$id]);
    if (!$v) fail(404, 'Không tìm thấy phiên bản.');
    $v['asset'] = asset_access((int)$v['asset_id'], $u);
    return $v;
}
function thread_access(int $id, array $u): array {
    $t = one('SELECT * FROM threads WHERE id=?', [$id]);
    if (!$t) fail(404, 'Không tìm thấy nhận xét.');
    $t['version'] = version_access((int)$t['version_id'], $u);
    return $t;
}
function activity(int $project, array $u, string $message, ?int $asset = null, bool $notify = false): void {
    sql('INSERT INTO activity(project_id,user_id,message) VALUES(?,?,?)', [$project,$u['id'],$message]);
    sql('UPDATE projects SET updated_at=CURRENT_TIMESTAMP WHERE id=?', [$project]);
    if ($notify) sql('INSERT INTO notifications(user_id,project_id,asset_id,message) SELECT user_id,?,?,? FROM project_members WHERE project_id=? AND user_id<>?', [$project,$asset,mb_substr($u['name'] . ': ' . $message,0,255),$project,$u['id']]);
}
function public_version(array $v): array { unset($v['filename']);
$v['url'] = 'image.php?id=' . $v['id'];
return $v;
}
function throttle(string $category, string $identity, int $limit): void {
    $bucket = hash('sha256', $category . '|' . $identity);
    $now = time();
    sql('INSERT INTO auth_attempts(bucket,attempts,window_start) VALUES(?,1,?) ON DUPLICATE KEY UPDATE attempts=IF(window_start < ?,1,attempts+1), window_start=IF(window_start < ?,VALUES(window_start),window_start)', [$bucket,$now,$now-900,$now-900]);
    if ((int)one('SELECT attempts FROM auth_attempts WHERE bucket=?',[$bucket])['attempts'] > $limit) fail(429, 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.');
}
function uploaded_image(): array {
    $f = $_FILES['image'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK) fail(422, 'Chưa nhận được ảnh. Kiểm tra tệp và giới hạn tải lên 15 MB.');
    if ($f['size'] > 15*1024*1024 || $f['size'] < 1) fail(422, 'Dung lượng ảnh tối đa là 15 MB.');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $ext = ['image/png'=>'png','image/jpeg'=>'jpg'][$mime] ?? null;
    $size = @getimagesize($f['tmp_name']);
    if (!$ext || !$size || $size[0]<1 || $size[1]<1 || $size[0]>16000 || $size[1]>16000 || $size[0]*$size[1]>60000000) fail(422, 'Chỉ nhận ảnh PNG hoặc JPEG hợp lệ, tối đa 60 triệu điểm ảnh và 16000 px mỗi chiều.');
    $name = bin2hex(random_bytes(24)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], ROOT.'/storage/uploads/'.$name)) fail(500, 'Không lưu được ảnh. Kiểm tra quyền ghi storage/uploads.');
    return ['filename'=>$name,'original_name'=>mb_substr(basename($f['name']),0,255),'mime_type'=>$mime,'file_size'=>$f['size'],'width'=>$size[0],'height'=>$size[1]];
}

function thread_label(array $t): string {
    $v=$t['version'];
    $a=$v['asset'];
    return '#'.$t['display_number'].' · '.$a['name'].' · v'.$v['version_number'];
}

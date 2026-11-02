<?php
declare(strict_types=1);

function api_dispatch(string $action, string $method): never {
    $get = ['session','projects','project','asset','threads','history','activity','notifications','reviews','export','invitations','admin.summary','admin.users','admin.projects','admin.audit'];
    if ($method !== (in_array($action,$get,true) ? 'GET' : 'POST')) fail(405,'Phương thức không được hỗ trợ.');
    if ($method === 'POST') csrf();
    if ($action === 'session') {
        if (!is_file(ROOT.'/config.local.php')) respond(['user'=>null,'csrf'=>$_SESSION['csrf'],'configured'=>false]);
        require_admin_schema();
        respond(['user'=>empty($_SESSION['uid'])?null:user(),'csrf'=>$_SESSION['csrf'],'configured'=>true]);
    }
    $d = $method === 'POST' ? input() : $_GET;
    require_admin_schema();
    if (in_array($action,['register','login'],true)) {
        $email = mb_strtolower(strval_input($d,'email',3,190));
        if (!filter_var($email,FILTER_VALIDATE_EMAIL)) fail(422,'Địa chỉ email không hợp lệ.');
        $password = $d['password'] ?? '';
        if (!is_string($password) || strlen($password)<8 || strlen($password)>72) fail(422,'Mật khẩu phải từ 8 đến 72 byte.');
        throttle($action.'-ip',$_SERVER['REMOTE_ADDR'] ?? 'local', $action==='login'?100:30);
        throttle($action.'-email',$email,15);
        if ($action === 'register') {
            $name = strval_input($d,'name',2,100);
            if (($d['password_confirm'] ?? '') !== $password) fail(422,'Hai mật khẩu không trùng nhau.');
            try { sql('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',[$name,$email,password_hash($password,PASSWORD_DEFAULT)]);
            }
            catch(PDOException $e) { if ($e->getCode()==='23000') fail(409,'Email này đã được đăng ký.');
            throw $e;
            }
            $uid = (int)db()->lastInsertId();
        } else {
            $row = one('SELECT * FROM users WHERE email=?',[$email]);
            if (!$row || !password_verify($password,$row['password_hash'])) fail(401,'Email hoặc mật khẩu không đúng.');
            if (!(int)$row['is_active']) fail(403,'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
            $uid = (int)$row['id'];
            sql('DELETE FROM auth_attempts WHERE bucket=?',[hash('sha256','login-email|'.$email)]);
        }
        session_regenerate_id(true);
        $_SESSION['uid']=$uid;
        $_SESSION['csrf']=bin2hex(random_bytes(32));
        $_SESSION['auth_version']=(int)one('SELECT auth_version FROM users WHERE id=?',[$uid])['auth_version'];
        respond(['user'=>user(),'csrf'=>$_SESSION['csrf']]);
    }
    $u = user();
    if(str_starts_with($action,'admin.')) {
        require_once __DIR__.'/Admin.php';
        admin_dispatch($action,$d,$u);
    }
    switch ($action) {
        case 'member.invite':
        case 'invitations':
        case 'invitation.accept':
        case 'invitation.decline':
            require_once __DIR__.'/actions/Invitations.php';
            handle_invitations($action,$d,$u);
        case 'project.transfer':
            require_once __DIR__.'/actions/Transfer.php';
            transfer_project($d,$u);
        case 'logout':
            $_SESSION=[];
            session_regenerate_id(true);
            $_SESSION['csrf']=bin2hex(random_bytes(32));
            respond(['csrf'=>$_SESSION['csrf']]);
        case 'profile.update':
            require_once __DIR__.'/Account.php';
            update_profile($d, $u);
        case 'project.delete':
        case 'asset.delete':
        case 'version.delete':
        case 'thread.delete':
        case 'reply.delete':
            require_once __DIR__.'/Delete.php';
            delete_content($action, $d, $u);
        case 'projects':
        case 'project.create':
        case 'project':
        case 'project.update':
        case 'project.archive':
            require_once __DIR__.'/actions/Projects.php';
            handle_projects($action, $d, $u);
        case 'member.save':
        case 'member.remove':
            require_once __DIR__.'/actions/Members.php';
            handle_members($action, $d, $u);
        case 'asset':
        case 'asset.rename':
        case 'asset.upload':
        case 'version.upload':
            require_once __DIR__.'/actions/Designs.php';
            handle_designs($action, $d, $u);
        case 'threads':
        case 'export':
        case 'thread.create':
        case 'thread.edit':
        case 'thread.status':
            require_once __DIR__.'/actions/Notes.php';
            handle_notes($action, $d, $u);
        case 'reply.create':
        case 'reply.edit':
            require_once __DIR__.'/actions/Replies.php';
            handle_replies($action, $d, $u);
        case 'history':
            require_once __DIR__.'/actions/History.php';
            handle_history($action, $d, $u);
        case 'review.create':
        case 'reviews':
            require_once __DIR__.'/actions/Reviews.php';
            handle_reviews($action, $d, $u);
        case 'activity':
        case 'notifications':
        case 'notifications.read':
            require_once __DIR__.'/actions/Activity.php';
            handle_activity($action, $d, $u);
        default: fail(404,'Chức năng không tồn tại.');
    }
}

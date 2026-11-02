<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../src/bootstrap.php';
require __DIR__.'/../src/Admin.php';
try {
    $options=getopt('', ['email:']);
    $email=mb_strtolower(trim((string)($options['email']??'')));
    if(!filter_var($email,FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Cach dung: php scripts/init-admin.php --email=ban@example.com');
    require_admin_schema();
    db()->beginTransaction();
    sql('SELECT id FROM admin_guard WHERE id=1 FOR UPDATE')->fetch();
    if((int)one("SELECT COUNT(*) n FROM users WHERE system_role='admin'")['n']>0) throw new RuntimeException('Da co admin. Hay dang nhap bang admin hien co de cap quyen; script chi khoi tao admin dau tien.');
    $u=one('SELECT id,name,email,is_active FROM users WHERE email=? FOR UPDATE',[$email]);
    if(!$u) throw new RuntimeException('Email chua dang ky. Tao tai khoan tren website truoc, sau do chay lai lenh.');
    if(!(int)$u['is_active']) throw new RuntimeException('Tai khoan dang bi khoa. Khong the khoi tao admin.');
    sql("UPDATE users SET system_role='admin' WHERE id=?",[$u['id']]);
    admin_audit((int)$u['id'],'admin.bootstrap','user',(int)$u['id'],['email'=>$u['email'],'name'=>$u['name'],'method'=>'local-cli']);
    db()->commit();
    echo 'Da cap admin dau tien cho '.$email.'. Dang nhap lai va mo muc Quan tri he thong.'.PHP_EOL;
} catch(Throwable $e) {
    try{if(db()->inTransaction())db()->rollBack();}catch(Throwable){}
    fwrite(STDERR,$e->getMessage().PHP_EOL);exit(1);
}

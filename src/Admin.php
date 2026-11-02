<?php
declare(strict_types=1);

function require_admin(array $u): void {
    if(($u['system_role']??'user')!=='admin' || !(int)($u['is_active']??0)) fail(403,'Chỉ quản trị viên hệ thống được sử dụng chức năng này.');
}
function admin_audit(?int $actor,string $action,string $type,int $id,array $details): void {
    sql('INSERT INTO admin_audit_log(actor_id,action,object_type,object_id,details) VALUES(?,?,?,?,?)',[$actor,$action,$type,$id,json_encode($details,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
}
function admin_bool(array $d,string $key): int {
    if(!array_key_exists($key,$d) || !in_array($d[$key],[true,false,0,1,'0','1'],true)) fail(422,'Trạng thái không hợp lệ.');
    return in_array($d[$key],[true,1,'1'],true)?1:0;
}
function admin_page(array $d): array {
    $page=$d['page']??1;
    if(filter_var($page,FILTER_VALIDATE_INT)===false || (int)$page<1 || (int)$page>100000) fail(422,'Trang không hợp lệ.');
    return [(int)$page,20,((int)$page-1)*20];
}
function admin_rows(string $select,string $from,string $where,array $params,string $order,array $d): never {
    [$page,$size,$offset]=admin_page($d);
    $total=(int)one('SELECT COUNT(*) n '.$from.' WHERE '.$where,$params)['n'];
    $rows=all($select.' '.$from.' WHERE '.$where.' ORDER BY '.$order." LIMIT $size OFFSET $offset",$params);
    respond(['items'=>$rows,'total'=>$total,'page'=>$page,'page_size'=>$size]);
}
function admin_dispatch(string $action,array $d,array $u): never {
    require_admin($u);
    if($action==='admin.summary') {
        $users=one("SELECT COUNT(*) total,SUM(is_active=1) active,SUM(system_role='admin' AND is_active=1) admins FROM users WHERE deleted_at IS NULL");
        $projects=one('SELECT COUNT(*) total,SUM(archived=1) archived,SUM(admin_locked=1) locked FROM projects');
        respond(['users'=>array_map('intval',$users),'projects'=>array_map('intval',$projects),'assets'=>(int)one('SELECT COUNT(*) n FROM assets')['n'],'open_threads'=>(int)one("SELECT COUNT(*) n FROM threads WHERE status='open'")['n']]);
    }
    if($action==='admin.users') {
        $where='u.deleted_at IS NULL';
        $params=[];
        $q=strval_input($d,'q',0,100);
        if($q!=='') { $where.=' AND (u.name LIKE ? OR u.email LIKE ?)';
        $params=['%'.$q.'%','%'.$q.'%'];
        }
        $role=$d['role']??'all';
        $state=$d['status']??'all';
        if(!in_array($role,['all','user','admin'],true)||!in_array($state,['all','active','blocked'],true)) fail(422,'Bộ lọc không hợp lệ.');
        if($role!=='all'){$where.=' AND u.system_role=?';
        $params[]=$role;
        }
        if($state!=='all'){$where.=' AND u.is_active=?';
        $params[]=$state==='active'?1:0;
        }
        admin_rows('SELECT u.id,u.name,u.email,u.created_at,u.system_role,u.is_active,(SELECT COUNT(*) FROM projects p WHERE p.owner_id=u.id) owned_projects','FROM users u',$where,$params,'u.id DESC',$d);
    }
    if($action==='admin.projects') {
        $where='1=1';
        $params=[];
        $q=strval_input($d,'q',0,100);
        $state=$d['status']??'all';
        if(!in_array($state,['all','active','archived','locked'],true)) fail(422,'Bộ lọc không hợp lệ.');
        if($q!==''){$where.=' AND (p.name LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
        $params=['%'.$q.'%','%'.$q.'%','%'.$q.'%'];
        }
        if($state==='active')$where.=' AND p.archived=0';
        if($state==='archived')$where.=' AND p.archived=1';
        if($state==='locked')$where.=' AND p.admin_locked=1';
        admin_rows('SELECT p.id,p.name,p.archived,p.admin_locked,p.updated_at,u.name owner_name,u.email owner_email,(SELECT COUNT(*) FROM assets a WHERE a.project_id=p.id) asset_count,(SELECT COUNT(*) FROM project_members m WHERE m.project_id=p.id) member_count','FROM projects p JOIN users u ON u.id=p.owner_id',$where,$params,'p.id DESC',$d);
    }
    if($action==='admin.audit') {
        admin_rows('SELECT l.id,l.action,l.object_type,l.object_id,l.details,l.created_at,u.name actor_name,u.email actor_email','FROM admin_audit_log l LEFT JOIN users u ON u.id=l.actor_id','1=1',[],'l.id DESC',$d);
    }
    if(!in_array($action,['admin.user.role','admin.user.status','admin.user.edit','admin.user.delete','admin.project.archive'],true)) fail(404,'Chức năng quản trị không tồn tại.');
    $id=idval($d['id']??0);
    // One guard row serializes administrative mutations and first-admin bootstrap.
    db()->beginTransaction();
    try {
        sql('SELECT id FROM admin_guard WHERE id=1 FOR UPDATE')->fetch();
        $actor=one('SELECT id,system_role,is_active,auth_version FROM users WHERE id=? FOR UPDATE',[$u['id']]);
        if(!$actor || (int)$actor['auth_version']!==(int)($_SESSION['auth_version']??0)) fail(401,'Phiên đăng nhập đã hết hạn.');
        require_admin($actor);
        if($action==='admin.project.archive') {
            $p=one('SELECT id,name,archived,admin_locked FROM projects WHERE id=? FOR UPDATE',[$id]);
            if(!$p) fail(404,'Không tìm thấy dự án.');
            $archived=admin_bool($d,'archived');
            if((int)$p['archived']!==$archived || (int)$p['admin_locked']!==$archived) {
                sql('UPDATE projects SET archived=?,admin_locked=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[$archived,$archived,$id]);
                admin_audit((int)$u['id'],$archived?'project.lock':'project.restore','project',$id,['name'=>$p['name'],'before'=>['archived'=>(int)$p['archived'],'admin_locked'=>(int)$p['admin_locked']],'after'=>['archived'=>$archived,'admin_locked'=>$archived]]);
                activity($id,$u,$archived?'Quản trị viên khóa và lưu trữ dự án':'Quản trị viên mở lại dự án');
            }
        } else {
            $target=one('SELECT id,name,email,system_role,is_active FROM users WHERE id=? AND deleted_at IS NULL FOR UPDATE',[$id]);
            if(!$target) fail(404,'Không tìm thấy người dùng.');
            if (in_array($action,['admin.user.edit','admin.user.delete'],true)) {
                require_once __DIR__.'/actions/AdminAccounts.php';
                manage_account($action,$d,$u,$target);
            }
            $role=$target['system_role'];
            $active=(int)$target['is_active'];
            if($action==='admin.user.role') {
                $role=$d['system_role']??'';
                if(!in_array($role,['admin','user'],true)) fail(422,'Quyền hệ thống không hợp lệ.');
            } else {
                $active=admin_bool($d,'is_active');
                if($id===(int)$u['id'] && !$active) fail(422,'Bạn không thể khóa chính tài khoản đang sử dụng.');
            }
            if($target['system_role']==='admin' && (int)$target['is_active'] && ($role!=='admin'||!$active)) {
                $count=(int)one("SELECT COUNT(*) n FROM users WHERE system_role='admin' AND is_active=1")['n'];
                if($count<=1) fail(409,'Phải giữ ít nhất một quản trị viên đang hoạt động.');
            }
            if($target['system_role']!==$role || (int)$target['is_active']!==$active) {
                $revoke=(int)$target['is_active']!==$active?1:0;
                sql('UPDATE users SET system_role=?,is_active=?,auth_version=auth_version+? WHERE id=?',[$role,$active,$revoke,$id]);
                admin_audit((int)$u['id'],$action==='admin.user.role'?'user.role':'user.status','user',$id,['name'=>$target['name'],'email'=>$target['email'],'before'=>['system_role'=>$target['system_role'],'is_active'=>(int)$target['is_active']],'after'=>['system_role'=>$role,'is_active'=>$active]]);
            }
        }
        db()->commit();
    } catch(Throwable $e) {if(db()->inTransaction())db()->rollBack();
    throw $e;
    }
    respond(['updated'=>true]);
}

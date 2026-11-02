<?php
declare(strict_types=1);

function handle_projects(string $action, array $d, array $u): never
{
    switch ($action) {
        case 'projects':
            respond(all('SELECT p.*, m.role, (SELECT COUNT(*) FROM assets a WHERE a.project_id=p.id) asset_count, (SELECT COUNT(*) FROM project_members mm WHERE mm.project_id=p.id) member_count, (SELECT COUNT(*) FROM threads t JOIN versions v ON v.id=t.version_id JOIN assets a ON a.id=v.asset_id WHERE a.project_id=p.id AND t.status="open") open_count, (SELECT v.id FROM versions v JOIN assets a ON a.id=v.asset_id WHERE a.project_id=p.id ORDER BY v.id DESC LIMIT 1) cover_id FROM projects p JOIN project_members m ON m.project_id=p.id WHERE m.user_id=? ORDER BY p.updated_at DESC,p.id DESC',[$u['id']]));
        case 'project.create':
            $name=strval_input($d,'name',2,150);
            $desc=strval_input($d,'description',0,3000);
            $color=$d['color']??'#7255e7';
            if (!is_string($color)||!preg_match('/^#[0-9a-fA-F]{6}$/',$color)) fail(422,'Màu không hợp lệ.');
            db()->beginTransaction();
            sql('INSERT INTO projects(owner_id,name,description,color) VALUES(?,?,?,?)',[$u['id'],$name,$desc,$color]);
            $id=(int)db()->lastInsertId();
            sql('INSERT INTO project_members(project_id,user_id,role) VALUES(?,?,"owner")',[$id,$u['id']]);
            activity($id,$u,'Tạo dự án '.$name);
            db()->commit();
            respond(['id'=>$id],201);
        case 'project':
            $p=project_access(idval($d['id']??0),$u);
            $p['members']=all('SELECT u.id,u.name,u.email,m.role FROM project_members m JOIN users u ON u.id=m.user_id WHERE m.project_id=? ORDER BY m.role,u.name',[$p['id']]);
            $p['assets']=all('SELECT a.*, (SELECT COUNT(*) FROM versions v WHERE v.asset_id=a.id) version_count, (SELECT MAX(version_number) FROM versions v WHERE v.asset_id=a.id) latest_version_number, (SELECT id FROM versions v WHERE v.asset_id=a.id ORDER BY version_number DESC LIMIT 1) latest_id, (SELECT COUNT(*) FROM threads t JOIN versions v ON v.id=t.version_id WHERE v.asset_id=a.id AND t.status="open") open_count FROM assets a WHERE a.project_id=? ORDER BY a.updated_at DESC,a.id DESC',[$p['id']]);
            respond($p);
        case 'project.update':
            $p=project_access(idval($d['id']??0),$u,true);
            active_project($p);
            sql('UPDATE projects SET name=?,description=? WHERE id=?',[strval_input($d,'name',2,150),strval_input($d,'description',0,3000),$p['id']]);
            activity((int)$p['id'],$u,'Cập nhật thông tin dự án');
            respond(['id'=>$p['id']]);
        case 'project.archive':
            $p=project_access(idval($d['id']??0),$u,false,true);
            db()->beginTransaction();
            $locked=one('SELECT admin_locked FROM projects WHERE id=? FOR UPDATE',[$p['id']]);
            if((int)$locked['admin_locked']) fail(403,'Dự án đang bị quản trị viên khóa. Chỉ quản trị viên có thể mở lại.');
            $archived=($d['archived']??false)?1:0;
            sql('UPDATE projects SET archived=? WHERE id=?',[$archived,$p['id']]);
            activity((int)$p['id'],$u,$archived?'Lưu trữ dự án':'Khôi phục dự án');
            db()->commit();
            respond(['archived'=>$archived]);
    }
    fail(404, 'Chức năng không tồn tại.');
}

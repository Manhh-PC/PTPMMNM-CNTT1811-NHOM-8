<?php
declare(strict_types=1);

function handle_members(string $action, array $d, array $u): never
{
    switch ($action) {
        case 'member.save':
            $p=project_access(idval($d['project_id']??0),$u,true);
            active_project($p);
            $email=mb_strtolower(strval_input($d,'email',3,190));
            $role=$d['role']??'';
            if (!in_array($role,['editor','reviewer','viewer'],true)) fail(422,'Quyền không hợp lệ.');
            $member=one('SELECT id FROM users WHERE email=? AND is_active=1',[$email]);
            if (!$member) fail(404,'Email chưa có tài khoản. Thành viên cần đăng ký trước khi được thêm vào dự án.');
            if ((int)$member['id']===(int)$p['owner_id']) fail(422,'Không thể thay đổi vai trò của chủ dự án.');
            db()->beginTransaction();
            sql('DELETE FROM invitations WHERE project_id=? AND user_id=?',[$p['id'],$member['id']]);
            sql('INSERT INTO project_members(project_id,user_id,role) VALUES(?,?,?) ON DUPLICATE KEY UPDATE role=VALUES(role)',[$p['id'],$member['id'],$role]);
            activity((int)$p['id'],$u,'Cấp quyền '.$role.' cho '.$email);
            db()->commit();
            respond(['id'=>$member['id']]);
        case 'member.remove':
            require_once dirname(__DIR__).'/Delete.php';
            require_delete_confirmation($d);
            $p=project_access(idval($d['project_id']??0),$u,true);
            active_project($p);
            $mid=idval($d['user_id']??0);
            if ($mid===(int)$p['owner_id'] || $mid===(int)$u['id']) fail(422,'Không thể loại chủ dự án hoặc chính bạn.');
            db()->beginTransaction();
            sql('DELETE FROM project_members WHERE project_id=? AND user_id=?',[$p['id'],$mid]);
            sql('DELETE FROM notifications WHERE project_id=? AND user_id=?',[$p['id'],$mid]);
            activity((int)$p['id'],$u,'Gỡ một thành viên khỏi dự án');
            db()->commit();
            respond(['removed'=>true]);
    }
    fail(404, 'Chức năng không tồn tại.');
}

<?php
declare(strict_types=1);

/** Gọi sau khi đã khóa admin_guard, kiểm tra lại người thao tác và khóa tài khoản đích. */
function manage_account(string $action, array $data, array $actor, array $target): never
{
    $id = (int)$target['id'];
    if ($action === 'admin.user.delete') {
        require_once dirname(__DIR__).'/Delete.php';
        require_delete_confirmation($data);
        if ($id === (int)$actor['id']) fail(422, 'Không thể xóa tài khoản đang sử dụng.');
        if ($target['system_role'] === 'admin') fail(409, 'Hãy gỡ quyền quản trị của tài khoản này trước khi xóa.');
        if (one('SELECT id FROM projects WHERE owner_id=? LIMIT 1', [$id])) {
            fail(409, 'Hãy chuyển quyền sở hữu hoặc xóa các dự án của người này trước.');
        }
        // Giữ khóa ngoại cho lịch sử, nhưng xóa danh tính, mật khẩu và quyền truy cập.
        $newEmail = 'removed-'.bin2hex(random_bytes(16)).'@deleted.invalid';
        $hash = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
        sql('UPDATE users SET name=?, email=?, password_hash=?, is_active=0,
            deleted_at=NOW(), auth_version=auth_version+1 WHERE id=?', ['Tài khoản đã xóa',$newEmail,$hash,$id]);
        sql('DELETE FROM invitations WHERE user_id=? OR invited_by=?',[$id,$id]);
        sql('DELETE FROM project_members WHERE user_id=?',[$id]);
        sql('DELETE FROM notifications WHERE user_id=?',[$id]);
        admin_audit((int)$actor['id'],'user.delete','user',$id,[]);
    } else {
        $name = strval_input($data,'name',2,100);
        $email = mb_strtolower(strval_input($data,'email',3,190));
        if (!filter_var($email,FILTER_VALIDATE_EMAIL)) fail(422,'Email không hợp lệ.');
        $password = $data['new_password'] ?? '';
        if (!is_string($password) || ($password !== '' && (strlen($password)<8 || strlen($password)>72))) {
            fail(422,'Mật khẩu mới phải từ 8 đến 72 byte.');
        }
        try {
            if ($password !== '') {
                sql('UPDATE users SET password_hash=? WHERE id=?',[password_hash($password,PASSWORD_DEFAULT),$id]);
            }
            sql('UPDATE users SET name=?, email=?, auth_version=auth_version+1 WHERE id=?',[$name,$email,$id]);
        } catch (PDOException $error) {
            if ($error->getCode()==='23000') fail(409,'Email đã có người sử dụng.');
            throw $error;
        }
        if ($id === (int)$actor['id']) $_SESSION['auth_version']++;
        admin_audit((int)$actor['id'],'user.edit','user',$id,['name'=>$name]);
    }
    db()->commit();
    respond(['updated'=>true]);
}

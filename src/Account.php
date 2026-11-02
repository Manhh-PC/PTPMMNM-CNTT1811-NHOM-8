<?php
declare(strict_types=1);

/** Cập nhật cả hồ sơ trong một transaction. Kiểm tra email trùng trước khi đổi phiên. */
function update_profile(array $data, array $user): never
{
    $name = strval_input($data, 'name', 2, 100);
    $email = mb_strtolower(strval_input($data, 'email', 3, 190));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail(422, 'Email không hợp lệ.');
    }
    $newPassword = $data['new_password'] ?? '';
    if (!is_string($newPassword) || ($newPassword !== '' && (strlen($newPassword) < 8 || strlen($newPassword) > 72))) {
        fail(422, 'Mật khẩu mới cần từ 8 đến 72 byte.');
    }
    if ($newPassword !== '' && $newPassword !== ($data['password_confirm'] ?? null)) {
        fail(422, 'Mật khẩu mới và phần xác nhận chưa khớp.');
    }

    db()->beginTransaction();
    $stored = one('SELECT password_hash, auth_version FROM users WHERE id=? FOR UPDATE', [$user['id']]);
    $currentPassword = $data['current_password'] ?? null;
    if (!is_string($currentPassword) || !password_verify($currentPassword, $stored['password_hash'])) {
        fail(422, 'Mật khẩu hiện tại không đúng.');
    }
    if ((int)$stored['auth_version'] !== (int)($_SESSION['auth_version'] ?? 0)) {
        fail(409, 'Hồ sơ đã được thay đổi. Đăng nhập lại để kiểm tra.');
    }
    $hash = $newPassword === '' ? $stored['password_hash'] : password_hash($newPassword, PASSWORD_DEFAULT);
    try {
        sql('UPDATE users SET name=?, email=?, password_hash=?, auth_version=auth_version+1 WHERE id=?',
            [$name, $email, $hash, $user['id']]);
        db()->commit();
    } catch (PDOException $error) {
        db()->rollBack();
        if ($error->getCode() === '23000') {
            fail(409, 'Email đã được dùng cho tài khoản khác.');
        }
        throw $error;
    }
    session_regenerate_id(true);
    $_SESSION['auth_version'] = (int)$stored['auth_version'] + 1;
    respond(user());
}


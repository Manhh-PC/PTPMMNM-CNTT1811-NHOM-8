<?php
declare(strict_types=1);

/** Lời mời chỉ cấp quyền sau khi đúng người nhận đồng ý. */
function handle_invitations(string $action, array $data, array $user): never
{
    if ($action === 'invitations') {
        respond(all('SELECT i.project_id, i.role, p.name, u.name invited_by
            FROM invitations i JOIN projects p ON p.id=i.project_id
            JOIN users u ON u.id=i.invited_by
            WHERE i.user_id=? AND p.archived=0 ORDER BY i.created_at DESC', [$user['id']]));
    }
    $projectId = idval($data['project_id'] ?? 0);
    db()->beginTransaction();
    if ($action === 'member.invite') {
        $project = project_access($projectId, $user, true);
        active_project($project);
        $email = mb_strtolower(strval_input($data, 'email', 3, 190));
        $role = $data['role'] ?? '';
        if (!in_array($role, ['viewer','reviewer','editor'], true)) fail(422, 'Quyền không hợp lệ.');
        $recipient = one('SELECT id FROM users WHERE email=? AND is_active=1', [$email]);
        if (!$recipient) fail(404, 'Hãy mời bằng email của một tài khoản đang hoạt động.');
        if (one('SELECT role FROM project_members WHERE project_id=? AND user_id=?', [$projectId,$recipient['id']])) {
            fail(409, 'Người này đã là thành viên. Chọn Cập nhật quyền để thay đổi vai trò.');
        }
        sql('INSERT INTO invitations(project_id,user_id,invited_by,role) VALUES(?,?,?,?)
            ON DUPLICATE KEY UPDATE invited_by=VALUES(invited_by),role=VALUES(role),created_at=CURRENT_TIMESTAMP',
            [$projectId,$recipient['id'],$user['id'],$role]);
        activity($projectId,$user,'Gửi lời mời tham gia dự án');
    } else {
        $invite = one('SELECT i.role,p.archived FROM invitations i JOIN projects p ON p.id=i.project_id
            WHERE i.project_id=? AND i.user_id=? FOR UPDATE', [$projectId,$user['id']]);
        if (!$invite) fail(404, 'Lời mời không còn tồn tại.');
        active_project($invite);
        if ($action === 'invitation.accept') {
            sql('INSERT INTO project_members(project_id,user_id,role) VALUES(?,?,?)
                ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)', [$projectId,$user['id'],$invite['role']]);
            activity($projectId,$user,'Đã nhận lời mời tham gia dự án');
        }
        sql('DELETE FROM invitations WHERE project_id=? AND user_id=?', [$projectId,$user['id']]);
    }
    db()->commit();
    respond(['saved'=>true]);
}

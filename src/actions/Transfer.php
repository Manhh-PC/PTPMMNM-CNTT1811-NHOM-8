<?php
declare(strict_types=1);

function transfer_project(array $data, array $user): never
{
    $id = idval($data['project_id'] ?? 0);
    $target = idval($data['user_id'] ?? 0);
    db()->beginTransaction();
    sql('SELECT id FROM projects WHERE id=? FOR UPDATE',[$id]);
    $project = project_access($id,$user,false,true);
    active_project($project);
    if ((int)$project['owner_id'] === $target) fail(422,'Thành viên này đã là chủ dự án.');
    $member = one('SELECT m.user_id FROM project_members m JOIN users u ON u.id=m.user_id
        WHERE m.project_id=? AND m.user_id=? AND u.is_active=1 FOR UPDATE',[$id,$target]);
    if (!$member) fail(422,'Chủ mới phải là thành viên đang hoạt động của dự án.');
    sql("UPDATE project_members SET role='editor' WHERE project_id=? AND user_id=?",[$id,$project['owner_id']]);
    sql("UPDATE project_members SET role='owner' WHERE project_id=? AND user_id=?",[$id,$target]);
    sql('UPDATE projects SET owner_id=? WHERE id=?',[$target,$id]);
    activity($id,$user,'Chuyển quyền sở hữu dự án');
    db()->commit();
    respond(['updated'=>true]);
}

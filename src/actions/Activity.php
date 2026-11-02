<?php
declare(strict_types=1);

function handle_activity(string $action, array $d, array $u): never
{
    switch ($action) {
        case 'activity':
            $p=project_access(idval($d['project_id']??0),$u);
            respond(all('SELECT a.*,u.name author_name FROM activity a JOIN users u ON u.id=a.user_id WHERE project_id=? ORDER BY a.id DESC LIMIT 200',[$p['id']]));
        case 'notifications':
            respond(all('SELECT n.* FROM notifications n JOIN project_members m ON m.project_id=n.project_id AND m.user_id=n.user_id WHERE n.user_id=? ORDER BY n.id DESC LIMIT 50',[$u['id']]));
        case 'notifications.read':
            sql('UPDATE notifications SET is_read=1 WHERE user_id=?',[$u['id']]);
            respond(['read'=>true]);
    }
    fail(404, 'Chức năng không tồn tại.');
}

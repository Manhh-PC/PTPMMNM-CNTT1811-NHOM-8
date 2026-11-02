<?php
declare(strict_types=1);

function handle_history(string $action, array $d, array $u): never
{
    switch ($action) {
        case 'history':
            $t=thread_access(idval($d['thread_id']??0),$u);
            respond(all('SELECT h.*,u.name author_name FROM status_history h JOIN users u ON u.id=h.user_id WHERE h.thread_id=? ORDER BY h.id',[$t['id']]));
    }
    fail(404, 'Chức năng không tồn tại.');
}

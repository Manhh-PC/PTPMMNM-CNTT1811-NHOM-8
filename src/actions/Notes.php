<?php
declare(strict_types=1);

function handle_notes(string $action, array $data, array $user): never
{
    switch ($action) {
        case 'thread.create':
            create_note($data, $user);
        case 'thread.edit':
        case 'thread.status':
            update_note($action, $data, $user);
        case 'threads':
        case 'export':
            $rows = project_notes($data, $user);
            if ($action === 'export') export_threads($rows);
            respond($rows);
        default:
            fail(404, 'Chức năng không tồn tại.');
    }
}

function project_notes(array $data, array $user): array
{
    $projectId = idval($data['project_id'] ?? 0);
    project_access($projectId, $user);
    $conditions = ['a.project_id=?'];
    $values = [$projectId];
    if (!empty($data['version_id'])) {
        $conditions[] = 't.version_id=?';
        $values[] = idval($data['version_id']);
    }
    if (in_array($data['status'] ?? null, ['open', 'resolved'], true)) {
        $conditions[] = 't.status=?';
        $values[] = $data['status'];
    }
    if (!empty($data['author_id'])) {
        $conditions[] = 't.author_id=?';
        $values[] = idval($data['author_id']);
    }
    $search = strval_input($data, 'q', 0, 200);
    if ($search !== '') {
        $conditions[] = '(t.body LIKE ? OR a.name LIKE ? OR u.name LIKE ?)';
        array_push($values, '%'.$search.'%', '%'.$search.'%', '%'.$search.'%');
    }

    $notes = all('SELECT t.*, u.name author_name, a.name asset_name, a.id asset_id,
                         v.version_number, v.width image_width, v.height image_height
                  FROM threads t JOIN users u ON u.id=t.author_id
                  JOIN versions v ON v.id=t.version_id JOIN assets a ON a.id=v.asset_id
                  WHERE '.implode(' AND ', $conditions).' ORDER BY v.id, t.display_number', $values);
    $replies = [];
    // Đọc theo lô để mỗi góp ý không cần một truy vấn riêng.
    foreach (array_chunk(array_column($notes, 'id'), 500) as $ids) {
        $places = implode(',', array_fill(0, count($ids), '?'));
        $batch = all('SELECT r.*, u.name author_name FROM replies r JOIN users u ON u.id=r.author_id
                      WHERE r.thread_id IN ('.$places.') ORDER BY r.id', $ids);
        foreach ($batch as $reply) $replies[$reply['thread_id']][] = $reply;
    }
    foreach ($notes as $index => $note) $notes[$index]['replies'] = $replies[$note['id']] ?? [];
    return $notes;
}

function create_note(array $data, array $user): never
{
    $version = version_access(idval($data['version_id'] ?? 0), $user);
    $project = $version['asset']['project'];
    comment_access($project);
    $body = strval_input($data, 'body', 1, 5000);
    $kind = $data['kind'] ?? 'point';
    if (!in_array($kind, ['point','rectangle'], true)) fail(422, 'Loại đánh dấu không hợp lệ.');

    $coords = [];
    foreach (['x','y','w','h'] as $key) {
        $value = $data[$key] ?? 0;
        if (!is_numeric($value) || !is_finite((float)$value) || $value < 0 || $value > 1) {
            fail(422, 'Tọa độ phải nằm trong ảnh.');
        }
        $coords[$key] = round((float)$value, 6);
    }
    if ($kind === 'point') {
        $coords['w'] = $coords['h'] = 0;
    } elseif ($coords['w'] < 0.001 || $coords['h'] < 0.001) {
        fail(422, 'Vùng đánh dấu quá nhỏ.');
    }
    if ($coords['x']+$coords['w'] > 1.000001 || $coords['y']+$coords['h'] > 1.000001) {
        fail(422, 'Vùng đánh dấu nằm ngoài ảnh.');
    }

    db()->beginTransaction();
    // Khóa đúng phiên bản. Hai người cùng gửi sẽ lần lượt nhận hai số khác nhau.
    $counter = one('SELECT next_note_number FROM versions WHERE id=? FOR UPDATE', [$version['id']]);
    if (!$counter) fail(404, 'Phiên bản đã bị xóa.');
    $number = (int)$counter['next_note_number'];
    sql('INSERT INTO threads(version_id, display_number, author_id, x, y, kind, w, h, body)
         VALUES(?,?,?,?,?,?,?,?,?)',
        [$version['id'], $number, $user['id'], $coords['x'], $coords['y'], $kind, $coords['w'], $coords['h'], $body]);
    $noteId = (int)db()->lastInsertId();
    sql("INSERT INTO status_history(thread_id,user_id,action,to_status,new_body,revision)
         VALUES(?,?,'created','open',?,1)", [$noteId,$user['id'],$body]);
    sql('UPDATE versions SET next_note_number=next_note_number+1 WHERE id=?', [$version['id']]);
    $label = '#'.$number.' · '.$version['asset']['name'].' · v'.$version['version_number'];
    activity((int)$project['id'], $user, 'Thêm góp ý '.$label, (int)$version['asset_id'], true);
    db()->commit();
    respond(['id'=>$noteId, 'display_number'=>$number], 201);
}

function update_note(string $action, array $data, array $user): never
{
    $note = thread_access(idval($data['id'] ?? 0), $user);
    $project = $note['version']['asset']['project'];
    comment_access($project);
    $revision = idval($data['revision'] ?? 0);
    if ($revision !== (int)$note['revision']) fail(409, 'Góp ý đã thay đổi. Tải bản mới để đối chiếu.');
    $body = $note['body'];
    $status = $note['status'];
    $resolvedBy = $note['resolved_by'];
    if ($action === 'thread.edit') {
        if ((int)$note['author_id'] !== (int)$user['id'] && $user['system_role'] !== 'admin') {
            fail(403, 'Bạn chỉ được sửa nhận xét do mình viết.');
        }
        $body = strval_input($data, 'body', 1, 5000);
        $event = 'edited';
        $message = 'Sửa góp ý ';
    } else {
        $status = $data['status'] ?? '';
        if (!in_array($status, ['open','resolved'], true)) fail(422, 'Trạng thái không hợp lệ.');
        $resolvedBy = $status === 'resolved' ? $user['id'] : null;
        $event = $status === 'resolved' ? 'resolved' : 'reopened';
        $message = $status === 'resolved' ? 'Đã xử lý góp ý ' : 'Mở lại góp ý ';
    }
    db()->beginTransaction();
    $changed = sql('UPDATE threads SET body=?,status=?,resolved_by=?,revision=revision+1
                    WHERE id=? AND revision=?', [$body,$status,$resolvedBy,$note['id'],$revision]);
    if ($changed->rowCount() !== 1) fail(409, 'Góp ý đã thay đổi. Tải bản mới để đối chiếu với nội dung đang nhập.');
    sql('INSERT INTO status_history(thread_id,user_id,action,from_status,to_status,old_body,new_body,revision)
         VALUES(?,?,?,?,?,?,?,?)', [$note['id'],$user['id'],$event,$note['status'],$status,$note['body'],$body,$revision+1]);
    activity((int)$project['id'], $user, $message.thread_label($note), (int)$note['version']['asset_id'], true);
    db()->commit();
    respond(['revision'=>$revision+1]);
}

require_once __DIR__.'/Export.php';

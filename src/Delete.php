<?php
declare(strict_types=1);

function require_delete_confirmation(array $data): void
{
    if (($data['confirmed'] ?? false) !== true) {
        fail(422, 'Bạn cần xác nhận trước khi xóa.');
    }
}

/** Cascade chỉ xóa dòng SQL. Tệp ảnh được xóa sau khi commit thành công. */
function delete_content(string $action, array $data, array $user): never
{
    require_delete_confirmation($data);
    $id = idval($data['id'] ?? 0);
    $files = [];
    db()->beginTransaction();
    if ($action === 'project.delete') {
        $project = project_access($id, $user, false, true);
        if ((int)$project['admin_locked'] && $user['system_role'] !== 'admin') fail(403, 'Dự án đang bị quản trị viên khóa.');
        sql('SELECT id FROM projects WHERE id=? FOR UPDATE', [$id]);
        $files = all('SELECT v.filename FROM versions v JOIN assets a ON a.id=v.asset_id WHERE a.project_id=? FOR UPDATE', [$id]);
        require_once __DIR__.'/Admin.php';
        admin_audit((int)$user['id'], 'project.delete', 'project', $id, ['name'=>$project['name']]);
        sql('DELETE FROM projects WHERE id=?', [$id]);
    } elseif ($action === 'asset.delete' || $action === 'version.delete') {
        $version = $action === 'version.delete' ? version_access($id, $user) : null;
        $asset = asset_access($version ? (int)$version['asset_id'] : $id, $user, true);
        active_project($asset['project']);
        sql('SELECT id FROM assets WHERE id=? FOR UPDATE', [$asset['id']]);
        $versions = all('SELECT id, filename FROM versions WHERE asset_id=? FOR UPDATE', [$asset['id']]);
        if ($version) {
            if (count($versions) < 2) {
                fail(422, 'Màn hình cần ít nhất một phiên bản. Để xóa toàn bộ, hãy chọn Xóa màn hình.');
            }
            $files = [$version];
            sql('DELETE FROM versions WHERE id=?', [$id]);
        } else {
            $files = $versions;
            sql('DELETE FROM assets WHERE id=?', [$id]);
        }
        activity((int)$asset['project_id'], $user, $version ? 'Xóa phiên bản v'.$version['version_number'] : 'Xóa màn hình '.$asset['name']);
    } else {
        $reply = $action === 'reply.delete' ? one('SELECT * FROM replies WHERE id=?', [$id]) : null;
        if ($action === 'reply.delete' && !$reply) fail(404, 'Trả lời không còn tồn tại.');
        $thread = thread_access($reply ? (int)$reply['thread_id'] : $id, $user);
        $project = $thread['version']['asset']['project'];
        comment_access($project);
        $author = (int)($reply['author_id'] ?? $thread['author_id']);
        if ($author !== (int)$user['id'] && !in_array($project['role'], ['owner', 'editor'], true)) {
            fail(403, 'Bạn chỉ được xóa nội dung của mình.');
        }
        $query = $reply ? 'DELETE FROM replies WHERE id=? AND revision=?' : 'DELETE FROM threads WHERE id=? AND revision=?';
        if (sql($query, [$id, idval($data['revision'] ?? 0)])->rowCount() !== 1) {
            fail(409, 'Nội dung đã thay đổi. Tải lại trước khi xóa.');
        }
        activity((int)$project['id'], $user, ($reply ? 'Xóa trả lời của góp ý ' : 'Xóa góp ý ').thread_label($thread));
    }
    db()->commit();
    foreach ($files as $file) {
        $name = $file['filename'];
        if (basename($name) === $name && !str_contains($name, '\\')) {
            $path = ROOT.'/storage/uploads/'.$name;
            if (is_file($path) && !unlink($path)) error_log('Không dọn được ảnh '.$name);
        }
    }
    respond(['deleted'=>true]);
}


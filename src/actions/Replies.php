<?php
declare(strict_types=1);

function handle_replies(string $action, array $d, array $u): never
{
    switch ($action) {
        case 'reply.create':
            $t=thread_access(idval($d['thread_id']??0),$u);
            $p=$t['version']['asset']['project'];
            comment_access($p);
            $body=strval_input($d,'body',1,5000);
            db()->beginTransaction();
            sql('INSERT INTO replies(thread_id,author_id,body) VALUES(?,?,?)',[$t['id'],$u['id'],$body]);
            $id=(int)db()->lastInsertId();
            activity((int)$p['id'],$u,'Trả lời góp ý '.thread_label($t),(int)$t['version']['asset_id'],true);
            db()->commit();
            respond(['id'=>$id],201);
        case 'reply.edit':
            $r=one('SELECT * FROM replies WHERE id=?',[idval($d['id']??0)]);
            if(!$r) fail(404,'Không tìm thấy trả lời.');
            $t=thread_access((int)$r['thread_id'],$u);
            comment_access($t['version']['asset']['project']);
            if((int)$r['author_id']!==(int)$u['id'] && $u['system_role']!=='admin') fail(403,'Bạn chỉ được sửa trả lời của chính mình.');
            $body=strval_input($d,'body',1,5000);
            $rev=idval($d['revision']??0);
            db()->beginTransaction();
            if(sql('UPDATE replies SET body=?,revision=revision+1 WHERE id=? AND revision=?',[$body,$r['id'],$rev])->rowCount()!==1) fail(409,'Trả lời đã thay đổi. Tải dữ liệu mới trước khi sửa.');
            activity((int)$t['version']['asset']['project_id'],$u,'Sửa trả lời #'.$r['id'],(int)$t['version']['asset_id']);
            db()->commit();
            respond(['revision'=>$rev+1]);
    }
    fail(404, 'Chức năng không tồn tại.');
}

<?php
declare(strict_types=1);

function handle_reviews(string $action, array $d, array $u): never
{
    switch ($action) {
        case 'review.create':
            $old=version_access(idval($d['old_version_id']??0),$u);
            $new=version_access(idval($d['new_version_id']??0),$u);
            $p=$old['asset']['project'];
            comment_access($p);
            if((int)$old['asset_id']!==(int)$new['asset_id'] || (int)$old['version_number']>=(int)$new['version_number']) fail(422,'Hãy chọn bản cũ và bản mới của cùng một màn hình.');
            $result=$d['result']??'';
            if(!in_array($result,['approved','changes_requested'],true)) fail(422,'Kết quả kiểm tra không hợp lệ.');
            $note=strval_input($d,'note',1,2000);
            db()->beginTransaction();
            sql('INSERT INTO review_checks(old_version_id,new_version_id,user_id,result,note) VALUES(?,?,?,?,?)',[$old['id'],$new['id'],$u['id'],$result,$note]);
            activity((int)$p['id'],$u,'Kiểm tra v'.$old['version_number'].' → v'.$new['version_number'].': '.($result==='approved'?'Đạt':'Cần sửa'),(int)$old['asset_id'],true);
            db()->commit();
            respond(['saved'=>true],201);
        case 'reviews':
            $a=asset_access(idval($d['asset_id']??0),$u);
            respond(all('SELECT r.*,u.name author_name,ov.version_number old_number,nv.version_number new_number FROM review_checks r JOIN users u ON u.id=r.user_id JOIN versions ov ON ov.id=r.old_version_id JOIN versions nv ON nv.id=r.new_version_id WHERE ov.asset_id=? ORDER BY r.id DESC',[$a['id']]));
    }
    fail(404, 'Chức năng không tồn tại.');
}

<?php
declare(strict_types=1);

function handle_designs(string $action, array $d, array $u): never
{
    switch ($action) {
        case 'asset':
            $a=asset_access(idval($d['id']??0),$u);
            $a['versions']=array_map('public_version',all('SELECT v.*,u.name author_name,(SELECT COUNT(*) FROM threads t WHERE t.version_id=v.id) thread_count FROM versions v JOIN users u ON u.id=v.created_by WHERE asset_id=? ORDER BY version_number DESC',[$a['id']]));
            respond($a);
        case 'asset.rename':
            $a=asset_access(idval($d['id']??0),$u,true);
            active_project($a['project']);
            sql('UPDATE assets SET name=? WHERE id=?',[strval_input($d,'name',1,150),$a['id']]);
            activity((int)$a['project_id'],$u,'Đổi tên màn hình '.$a['name'],(int)$a['id']);
            respond(['id'=>$a['id']]);
        case 'asset.upload':
        case 'version.upload':
            if ($action==='asset.upload') { $p=project_access(idval($d['project_id']??0),$u,true);
            $name=strval_input($d,'name',1,150);
            }
            else { $a=asset_access(idval($d['asset_id']??0),$u,true);
            $p=$a['project'];
            }
            active_project($p);
            $note=strval_input($d,'note',0,1000);
            $f=uploaded_image();
            try {
                db()->beginTransaction();
                if ($action==='asset.upload') {
                    sql('INSERT INTO assets(project_id,name,created_by) VALUES(?,?,?)',[$p['id'],$name,$u['id']]);
                    $aid=(int)db()->lastInsertId();
                } else { $aid=(int)$a['id'];
                }
                // Serialise version allocation for one design. Older versions and their annotations never change.
                sql('SELECT id FROM assets WHERE id=? FOR UPDATE',[$aid]);
                $number=(int)one('SELECT COALESCE(MAX(version_number),0)+1 n FROM versions WHERE asset_id=?',[$aid])['n'];
                sql('INSERT INTO versions(asset_id,version_number,filename,original_name,mime_type,file_size,width,height,note,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)',[$aid,$number,$f['filename'],$f['original_name'],$f['mime_type'],$f['file_size'],$f['width'],$f['height'],$note,$u['id']]);
                $vid=(int)db()->lastInsertId();
                sql('UPDATE assets SET updated_at=CURRENT_TIMESTAMP WHERE id=?',[$aid]);
                activity((int)$p['id'],$u,'Tải phiên bản v'.$number.' của '.($name??$a['name']),$aid,true);
                db()->commit();
            } catch(Throwable $e) { if(db()->inTransaction()) db()->rollBack();
            @unlink(ROOT.'/storage/uploads/'.$f['filename']);
            throw $e;
            }
            respond(['asset_id'=>$aid,'version_id'=>$vid],201);
    }
    fail(404, 'Chức năng không tồn tại.');
}

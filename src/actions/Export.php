<?php
declare(strict_types=1);

function export_threads(array $notes): never
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="pixelnote-gop-y-'.date('Ymd-His').'.csv"');
    $out = fopen('php://output','wb');
    fwrite($out, "\xEF\xBB\xBF");
    $head = ['STT trong phiên bản','ID nội bộ','Màn hình','Phiên bản','Loại','X gốc (px)','Y gốc (px)',
             'Rộng (px)','Cao (px)','X chuẩn hóa','Y chuẩn hóa','Rộng chuẩn hóa','Cao chuẩn hóa',
             'Nội dung','Người viết','Trạng thái','Thời gian','Trả lời'];
    fputcsv($out, $head, ',', '"', '');
    foreach ($notes as $note) {
        $replies = array_map(fn($r) => $r['author_name'].': '.$r['body'], $note['replies']);
        $row = [
            $note['display_number'], $note['id'], $note['asset_name'], 'v'.$note['version_number'], $note['kind'],
            round($note['x']*$note['image_width'],3), round($note['y']*$note['image_height'],3),
            round($note['w']*$note['image_width'],3), round($note['h']*$note['image_height'],3),
            $note['x'],$note['y'],$note['w'],$note['h'],$note['body'],$note['author_name'],
            $note['status'],$note['created_at'],implode(' | ', $replies)
        ];
        // Giữ nội dung bắt đầu bằng dấu công thức ở dạng văn bản trong bảng tính.
        $row = array_map(fn($cell) => preg_match('/^[=+\-@\t\r\n]/', (string)$cell) ? "'".$cell : $cell, $row);
        fputcsv($out, $row, ',', '"', '');
    }
    fclose($out);
    exit;
}

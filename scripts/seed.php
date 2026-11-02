<?php
declare(strict_types=1);
function seed_demo(): void {
    // Nạp mẫu trước khi tự đăng ký để tránh trùng tài khoản hoặc ghi đè thiết kế thật.
    if (one('SELECT id FROM users LIMIT 1')) {
        echo "Đã có người dùng. Bỏ qua nạp dữ liệu mẫu.\n";
        return;
    }
    $files = glob(ROOT.'/database/demo-images/*.png');
    if (count($files)!==12) throw new RuntimeException('Cần đủ 12 ảnh mẫu.');
    foreach ($files as $file) {
        if (!copy($file,ROOT.'/storage/uploads/seed-'.basename($file))) {
            throw new RuntimeException('Kiểm tra quyền ghi storage/uploads.');
        }
    }
    db()->beginTransaction();
    $ids = [];
    $accounts = [];
    foreach ([['An Phạm','designer'],['Linh Nguyễn','reviewer'],['Minh Trần','viewer']] as [$name,$alias]) {
        $email = $alias.'@pixelnote.test';
        $password = bin2hex(random_bytes(10));
        sql('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',[$name,$email,password_hash($password,PASSWORD_DEFAULT)]);
        $ids[] = (int)db()->lastInsertId();
        $accounts[] = $email.' / '.$password;
    }
    $texts=['Điểm mẫu (750; 150) trên ảnh 1000 × 500. Khi hiển thị 500 × 250, ghim phải ở (375; 75).','Khoảng cách vùng này hơi chật. Tăng khoảng trống để bố cục dễ đọc hơn.','Màu nút cần nổi bật hơn so với nền.','Có thể làm tiêu đề ngắn và rõ ý hơn không?','Căn lề nhóm nội dung cho thẳng hàng nhé.','Kiểm tra độ tương phản của dòng mô tả.','Mình thích hướng thiết kế này, giữ lại phần hình minh họa.','Hãy làm rõ thông tin giá và đơn vị tiền tệ.','Thêm khoảng cách giữa tiêu đề và nội dung.','Phiên bản mới đã thoáng hơn; cần rà lại nút hành động.','Kiểm tra cách hiển thị ở màn hình nhỏ.','Phần mô tả đã ổn, mình xác nhận đã xử lý.','Vùng ảnh nên đồng nhất với tỉ lệ các thẻ còn lại.','Nút này nên thể hiện rõ hành động sẽ thực hiện.','Thử giảm độ đậm của đường phân cách.','Nội dung ở đây cần căn theo cùng một trục.','Sửa lại nhãn cho dễ hiểu với người mới.','Tăng chiều cao nút để dễ bấm trên điện thoại.','Bố cục bản mới cân đối hơn bản trước.','Đã rà soát, giữ góp ý cũ ở đúng phiên bản để đối chiếu.'];
    $counter=0;
    $firstThread=null;
    for($p=1;$p<=2;$p++) {
        $names=[1=>'Lumi · Nội thất cho cuộc sống',2=>'Nomad · Hành trình Việt Nam'];
        sql('INSERT INTO projects(owner_id,name,description,color) VALUES(?,?,?,?)',[$ids[0],$names[$p],$p===1?'Không gian góp ý website nội thất Lumi. Cùng làm rõ từng chi tiết trước khi bàn giao.':'Thiết kế trải nghiệm khám phá Việt Nam. Dự án riêng để kiểm thử phạm vi truy cập.',$p===1?'#7255e7':'#278b78']);
        $pid=(int)db()->lastInsertId();
        sql('INSERT INTO project_members(project_id,user_id,role) VALUES(?,?,"owner"),(?,?,"viewer")',[$pid,$ids[0],$pid,$ids[2]]);
        if($p===1) sql('INSERT INTO project_members(project_id,user_id,role) VALUES(?,?,"reviewer")',[$pid,$ids[1]]);
        for($s=1;$s<=3;$s++) {
            $screen=[1=>'Trang chủ',2=>'Bộ sưu tập',3=>'Chi tiết sản phẩm'];
            if($p===2) $screen=[1=>'Trang chủ',2=>'Điểm đến',3=>'Chi tiết hành trình'];
            sql('INSERT INTO assets(project_id,name,created_by) VALUES(?,?,?)',[$pid,$screen[$s],$ids[0]]);
            $aid=(int)db()->lastInsertId();
            $versions=[];
            for($v=1;$v<=2;$v++) {
                $file="p$p-s$s-v$v.png";
                $path=ROOT.'/database/demo-images/'.$file;
                if(!is_file($path)) throw new RuntimeException('Thieu anh demo: '.$file);
                sql('INSERT INTO versions(asset_id,version_number,filename,original_name,mime_type,file_size,width,height,note,created_by) VALUES(?,?,?,?,"image/png",?,1000,500,?,?)',[$aid,$v,'seed-'.$file,$file,filesize($path),$v===1?'Bản thiết kế đầu tiên.':'Điều chỉnh vị trí nút, màu sắc và khoảng cách theo góp ý.',$ids[0]]);
                $vid=(int)db()->lastInsertId();
                $versions[]=$vid;
                $count=$p===1?($v===1?3:1):(($s<3&&$v===1)?2:1);
                for($k=0;$k<$count;$k++) {
                    $n=$counter++;
                    $author=$p===1?($n%3===0?$ids[0]:$ids[1]):$ids[0];
                    $rect=$n%3===1;
                    $x=$n===0?0.75:($rect?0.09:0.18+($n%4)*0.18);
                    $y=$n===0?0.3:($rect?0.27:0.42+($n%3)*0.12);
                    $status=in_array($n,[5,11,18],true)?'resolved':'open';
                    sql('INSERT INTO threads(version_id,display_number,author_id,x,y,kind,w,h,body,status) VALUES(?,?,?,?,?,?,?,?,?,?)',[$vid,$k+1,$author,$x,$y,$rect?'rectangle':'point',$rect?0.3:0,$rect?0.18:0,$texts[$n],$status]);
                    $tid=(int)db()->lastInsertId();
                    sql('INSERT INTO status_history(thread_id,user_id,action,to_status,new_body,revision) VALUES(?,?,"created","open",?,1)',[$tid,$author,$texts[$n]]);
                    if($status==='resolved') {
                        sql('UPDATE threads SET revision=2,resolved_by=? WHERE id=?',[$ids[0],$tid]);
                        sql('INSERT INTO status_history(thread_id,user_id,action,from_status,to_status,revision) VALUES(?,?,"resolved","open","resolved",2)',[$tid,$ids[0]]);
                    }
                    if($n===0) $firstThread=$tid;
                }
            }
            if($s===1) sql('INSERT INTO review_checks(old_version_id,new_version_id,user_id,result,note) VALUES(?,?,?,"changes_requested",?)',[$versions[0],$versions[1],$p===1?$ids[1]:$ids[0],'Đã đối chiếu hai phiên bản. Kiểm tra tiếp khoảng cách và độ tương phản của nút.']);
        }
        sql('INSERT INTO activity(project_id,user_id,message) VALUES(?,?,?)',[$pid,$ids[0],'Khởi tạo dự án mẫu, 3 màn hình và 6 phiên bản ảnh.']);
    }
    foreach([[$ids[0],'Mình đã nhận góp ý. Bản v2 sẽ đổi vị trí nút; ghi chú này vẫn giữ ở v1.'],[$ids[1],'Mình sẽ mở hai phiên bản cạnh nhau để kiểm tra sau khi bạn tải bản mới.']] as $r) sql('INSERT INTO replies(thread_id,author_id,body) VALUES(?,?,?)',[$firstThread,$r[0],$r[1]]);
    sql('UPDATE versions v SET next_note_number=(SELECT COALESCE(MAX(t.display_number),0)+1 FROM threads t WHERE t.version_id=v.id) WHERE v.created_by=?', [$ids[0]]);
    db()->commit();
    echo 'Đã nạp hai dự án mẫu. Hãy lưu lại email và mật khẩu dưới đây.'.PHP_EOL;
    foreach ($accounts as $line) echo $line.PHP_EOL;
}

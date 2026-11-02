# Cách đọc mã PixelNote

## Một lần gửi góp ý đi qua những tệp nào?

Trình duyệt mở `public/review.php?id=…`. Trang dùng khung `views/workspace.php`. Tệp `public/assets/pages/review.js` lấy màn hình, phiên bản và danh sách góp ý, sau đó vẽ ảnh, ghim và danh sách bên cạnh. Khi người dùng chọn Gửi, `public/assets/workspace.js` gửi JSON kèm CSRF đến `public/api.php?action=thread.create`. Bộ điều phối `src/Api.php` chuyển yêu cầu sang `src/actions/Notes.php`.

## Số thứ tự của từng phiên bản

`threads.id` là ID kỹ thuật dùng trong liên kết, trả lời và lịch sử. Người dùng nhìn thấy `threads.display_number`. Khóa duy nhất là cặp `(version_id, display_number)`.

1. Phiên bản mới nhận `versions.next_note_number = 1` từ khai báo mặc định của database.
2. Máy chủ kiểm tra quyền góp ý, nội dung và tọa độ, sau đó bắt đầu transaction.
3. `SELECT next_note_number … FOR UPDATE` khóa đúng dòng phiên bản và đọc số kế tiếp. Máy chủ chèn góp ý, ghi lịch sử và tăng bộ đếm. Các thay đổi được commit cùng nhau.
4. Người gửi đồng thời vào cùng phiên bản phải chờ lượt khóa. Khi lưu lỗi và rollback, lần ghi thất bại không tiêu thụ số. Các phiên bản khác có bộ đếm riêng.
5. Ghim, danh sách, kết quả lọc và CSV cùng đọc số đã lưu. Xóa #2 không làm #3 đổi tên. Trả lời thuộc một góp ý và không tiêu thụ số mới.

## Tọa độ và so sánh

Lấy hình chữ nhật hiển thị thật của ảnh bằng `getBoundingClientRect()`. Với con trỏ tại `(clientX, clientY)`, tọa độ ngang bằng `(clientX − left) / width`, tọa độ dọc tính tương tự. Điểm gốc (750,150) của ảnh 1000 × 500 tương ứng (0,75; 0,30), nên hiển thị ở (375,75) khi ảnh còn 500 × 250, tính từ góc trên trái ảnh. Khoanh vùng lưu góc trái trên, chiều rộng và chiều cao theo tỉ lệ. Vùng đệm bên ngoài ảnh không tham gia phép tính.

Góp ý gắn với một version_id. Tải bản mới tạo dòng phiên bản và tệp riêng. Chế độ song song truy vấn riêng góp ý của hai phiên bản. Bộ chọn so sánh loại cặp cùng phiên bản hoặc sai thứ tự. Máy chủ xác minh lại cả màn hình và thứ tự khi ghi kết quả.

## Quyền, đồng thời và lưu trữ

- Dữ liệu chính đi từ dự án đến màn hình, phiên bản, góp ý và trả lời. Bảng project_members liên kết tài khoản với vai trò ở từng dự án. Lời mời nằm riêng cho đến khi người nhận đồng ý.
- Mỗi lần mở ảnh, image.php kiểm tra lại phiên và quyền xem dự án trước khi đọc tệp trong storage/uploads. Tên tệp tải lên được sinh ngẫu nhiên.
- Mỗi ghi chú và trả lời có revision. Khi sửa hoặc xóa, câu lệnh dùng điều kiện id và revision. Nếu có người sửa trước, máy chủ trả HTTP 409. Tạo trả lời chèn một dòng mới nên hai người có thể trả lời cùng lúc.
- Xóa cần xác nhận tại giao diện và trường boolean confirmed ở phía máy chủ. Khóa ngoại dọn bản ghi phụ thuộc. Tệp ảnh được dọn sau khi transaction đã commit.
- Quản trị viên cuối cùng được bảo vệ bằng khóa admin_guard. Khi admin xóa một tài khoản, hệ thống loại bỏ thông tin đăng nhập và quyền truy cập, đồng thời giữ khóa ngoại cho lịch sử dưới tên “Tài khoản đã xóa”.
- Mã PHP dùng PDO với tham số ràng buộc. Mật khẩu dùng password_hash/password_verify, thao tác ghi kiểm tra CSRF. Cấu hình riêng, phiên đăng nhập và ảnh tải lên nằm ngoài public.


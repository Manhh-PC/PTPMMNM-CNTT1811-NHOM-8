# PixelNote — Góp ý trực tiếp trên ảnh thiết kế

Ứng dụng PHP và MySQL cho nhóm cần duyệt một thiết kế qua nhiều phiên bản. Giao diện tiếng Việt. Ảnh dự án được lưu ngoài thư mục web và được kiểm tra quyền khi đọc.

## Chạy lần đầu

1. Mở **HUONG-DAN.html** ngay trong thư mục này bằng trình duyệt. Tệp đọc được khi chưa cài web.
2. Cài XAMPP có PHP 8.2+, bật PDO MySQL, mbstring, fileinfo. Dùng MySQL Community Server 8 và Workbench. Cấu hình Apache phục vụ thư mục `public/`.
3. Tạo database mới, tài khoản ứng dụng và nhập toàn bộ `database/schema.sql`. Sao chép `config.example.php` thành `config.local.php` rồi sửa thông tin kết nối.
4. Chạy `php scripts/php-check.php` và `php scripts/database-status.php`. Nếu muốn dữ liệu minh họa, chạy `php scripts/install.php --demo` **trước khi tự đăng ký**. Lưu mật khẩu ngẫu nhiên cho 3 tài khoản do terminal in ra.
5. Đăng ký tài khoản riêng trên web rồi chạy `php scripts/init-admin.php --email=ban@example.com` với email vừa đăng ký. Mở `http://localhost/pixelnote/` khi dùng Alias trong hướng dẫn.

Với PHP của XAMPP ở PowerShell, thay `php` bằng `& C:\xampp\php\php.exe`. Phần 06 của hướng dẫn có lệnh tương đương cho Ubuntu WSL.

## Sử dụng

- Trang dự án quản lý thành viên, lời mời trong ứng dụng, màn hình PNG/JPEG, tìm kiếm và xuất CSV.
- Trên ảnh, dùng **C** để ghim một điểm, **R** để khoanh vùng, **V** để quay về chọn. Ghim và thẻ góp ý cùng hiển thị số của phiên bản. Tác giả có thể sửa hoặc trả lời. Nhóm có thể đóng, mở lại và xem lịch sử.
- Mỗi phiên bản mới bắt đầu với danh sách góp ý trống. Ba góp ý theo thứ tự được lưu trên v1 là **#1, #2, #3**. Hai góp ý đầu trên v2 là **#1, #2**. Trả lời, sửa, lọc và xóa không đổi số đã cấp. Sau khi xóa #2 của v1, góp ý mới là #4.
- So sánh mở hai phiên bản khác nhau của cùng màn hình. Chọn chế độ song song hoặc thanh chia nếu ảnh cùng tỉ lệ. Ghi kết quả kiểm tra **Đạt** hoặc **Cần sửa tiếp**.
- Chọn tên tài khoản để đổi tên, email hoặc mật khẩu. Chọn **Quản trị hệ thống** để quản lý người dùng và mọi dự án. Xóa dữ liệu cần xác nhận.
- Dữ liệu mẫu có 2 dự án, 3 tài khoản, 6 màn hình, 12 phiên bản, 20 góp ý. Hai kịch bản trình bày có trong **docs/DEMO.md**.

## Sửa đúng tệp

| Muốn thay đổi | Tệp cần mở |
|---|---|
| Nền trang chủ | `public/assets/home.css`, biến `--home-background` ngay đầu tệp |
| Nội dung, vị trí các khối trang chủ | `public/index.php` |
| Đăng nhập, đăng ký, tài khoản | `public/login.php`, `register.php`, `account.php` trong cùng thư mục |
| Danh sách dự án, chi tiết, duyệt ảnh, so sánh | Trang PHP tương ứng trong `public/`, nội dung tương tác riêng trong `public/assets/pages/` |
| Khung điều hướng, bố cục dùng chung | `views/workspace.php`, `public/assets/app.js`, `public/assets/app.css` |
| Gửi yêu cầu từ các nút và biểu mẫu | `public/assets/workspace.js`, `manage.js`, `forms.js` |
| Đánh số, lọc và xuất góp ý | `src/actions/Notes.php` và các bảng `versions`, `threads` |
| Kiểm tra quyền và lưu ảnh | `src/bootstrap.php`, `public/image.php`, `src/actions/Designs.php` |
| Quyền hệ thống, tài khoản, xóa | `src/Admin.php`, `src/actions/AdminAccounts.php`, `src/Account.php`, `src/Delete.php` |

## Quyền

| Vai trò | Phạm vi |
|---|---|
| Chỉ xem | Xem ảnh, ghi chú, so sánh, lịch sử và CSV của dự án được cấp quyền |
| Góp ý | Thêm ghim, khoanh vùng, trao đổi, sửa/xóa nội dung của mình, cập nhật trạng thái, ghi kết quả kiểm tra |
| Quản lý | Thêm quyền quản lý thành viên, màn hình, phiên bản và điều tiết nội dung |
| Chủ dự án | Thêm quyền chuyển sở hữu, lưu trữ, khôi phục và xóa dự án |
| Admin hệ thống | Quản lý mọi dự án, chỉnh sửa hồ sơ, khóa/xóa tài khoản, cấp/gỡ quyền admin và xem nhật ký |

## Tài liệu đi kèm

- **docs/THIET-KE.md** giải thích cấu trúc dữ liệu, cách lưu tọa độ, đánh số và tránh ghi đè đồng thời.
- **TESTING.md** mô tả kết quả đã kiểm tra và các lệnh chạy lại. **docs/HANDOFF.md** có bảng đối chiếu, chỗ điền thành viên và quy trình tạo GitHub Release.
- **CONTRIBUTING.md**, **LICENSE** và **ATTRIBUTIONS.md** ghi quy trình đóng góp, giấy phép và nguồn tài nguyên.


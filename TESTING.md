# Kiểm thử PixelNote

## Kết quả bản bàn giao

Các bài kiểm tra chạy bằng PHP 8.3 và MySQL Community Server 8.0.46 trên Linux, với PHP HTTP server 4 worker. Các bộ dưới đây dùng HTTP thật, cookie, CSRF và database InnoDB. Môi trường chạy kiểm thử giao diện dùng Node với sự kiện và điều khiển DOM mô phỏng.

| Bộ kiểm tra | Kết quả và phạm vi |
|---|---|
| tests/integration.py | 25 nhóm đạt. Phân quyền, tải ảnh, tọa độ, số riêng từng phiên bản, xung đột cập nhật, trả lời đồng thời, so sánh và CSV |
| tests/admin_integration.py | 25 nhóm đạt. Quyền toàn hệ thống, sửa/khóa/xóa tài khoản, thu hồi phiên, bảo vệ admin cuối cùng và nhật ký |
| tests/delivery.py | 9 nhóm đạt. Các trang PHP và tài nguyên, đổi tên/email/mật khẩu, lời mời, xác nhận xóa, quyền sở hữu, số hiển thị sau khi xóa và lọc |
| tests/geometry.test.js | 6 phép kiểm tra tọa độ. Ví dụ (750,150) chuyển thành (375,75) trên ảnh thu nhỏ một nửa |
| tests/comparison.test.cjs | 8 nhóm đạt. Cặp phiên bản hợp lệ, thanh chia, chuột, cảm ứng mô phỏng và bàn phím |
| tests/interface.test.cjs | 4 nhóm đạt. URL PHP đúng phiên bản, cấm chọn trùng ở cả hai ô, số trên ghim và thẻ, Hủy xóa không gửi yêu cầu |
| tests/seed-check.php | Đủ 3 tài khoản, 2 dự án, 6 màn hình, 12 phiên bản, 20 góp ý và điểm mẫu đúng vị trí |

## Chạy lại

Giải nén dự án thêm một lần ở thư mục riêng. Tạo database thử **có tên kết thúc bằng `_test`** và cấu hình **bản sao** dùng database đó. Nhập schema, nạp demo trước khi đăng ký thêm người. Các bài chạy cần một database mẫu chưa có admin. Dùng cùng thư mục config cho web, terminal và Python. Các tài khoản và dự án thử có tiền tố ngẫu nhiên, được dọn sau mỗi lượt. Nếu chạy nhiều lượt ngay liền nhau, giới hạn đăng ký theo IP có thể yêu cầu chờ 15 phút.

Ví dụ dưới đây dùng Ubuntu với PHP CLI và MySQL cục bộ. Cần có các lệnh `php`, `node`, `python3` trong PATH. Trên Windows có thể chạy HTTP qua Apache của XAMPP, thêm `C:\xampp\php` vào PATH của terminal, dùng `python` hoặc `py -3` và thay base URL bằng URL Apache của bản sao thử.

```bash
php scripts/php-check.php
php scripts/install.php --demo
php tests/seed-check.php
node tests/geometry.test.js
node tests/comparison.test.cjs
node tests/interface.test.cjs
# Terminal 1, giữ cửa sổ này mở
PHP_CLI_SERVER_WORKERS=4 php -S 127.0.0.1:8089 -t public
```

```bash
# Terminal 2, cùng thư mục
python3 tests/integration.py http://127.0.0.1:8089 --isolated-test-db
python3 tests/admin_integration.py http://127.0.0.1:8089 --isolated-test-db
python3 tests/delivery.py http://127.0.0.1:8089 --isolated-test-db
```

## Kiểm tra trực tiếp bằng trình duyệt sau cài đặt XAMPP

1. Mở trang chủ trên màn hình rộng và điện thoại, đăng ký, đăng nhập rồi cập nhật hồ sơ.
2. Trong Lumi, mở Trang chủ v1 tại hai kích thước. Kiểm tra ghim #1 ở 75% chiều rộng và 30% chiều cao của ảnh. Kéo vùng theo hai hướng rồi tải lại.
3. Chạy hai tình huống trong **docs/DEMO.md**. Đặc biệt, thử Hủy trước khi xác nhận xóa; thử sao chép đường dẫn ảnh riêng giữa hai tài khoản.
4. Mở CSV bằng Excel hoặc LibreOffice Calc với UTF-8 và dấu phẩy. So khớp phiên bản, số góp ý và tọa độ với ghi chú trên ảnh.

Bản ZIP được kiểm thử tự động trên Linux. Thao tác cài XAMPP/Workbench và kiểm tra trực quan trên máy Windows của nhóm là phần nghiệm thu tại máy đích.


# Đối chiếu đề bài và bàn giao

| Yêu cầu | Nơi thực hiện |
|---|---|
| Dự án, thành viên, quyền, PNG/JPEG | project.*, member.*, asset.upload; trang dự án |
| Điểm / vùng / chọn ghim | geometry.js, pages/review.js; thread.create |
| Trả lời, sửa, đóng/mở, lọc | reply.*, thread.edit/status, lịch sử |
| Phiên bản / song song / kiểm tra sau sửa | version.upload, comparePage, review_checks |
| Lịch sử / tìm kiếm / xuất | status_history, activity, export |
| Tọa độ theo ảnh, lề và zoom | geometry.test.js; bindCanvas/fitStage |
| Phiên bản cố định / quyền / xung đột | foreign key version_id; project_access; revision |
| Dữ liệu 2/3/3/2/20 | scripts/seed.php, database/demo-images |
| Năm phép thử bắt buộc | TESTING.md và tests/ |
| Giấy phép / nguồn / cộng tác | LICENSE, ATTRIBUTIONS, CONTRIBUTING, mẫu .github |

## Trước khi nộp

1. Điền tên nhóm, tên/MSSV thành viên, phân công thực tế vào README. Ghi các phần dùng AI theo yêu cầu học phần.
2. Tạo repository GitHub của nhóm; cấp quyền đọc cho giảng viên. Không đưa thông tin cấu hình local lên Git.
3. Mỗi người thực hiện thay đổi có ý nghĩa, commit riêng; tạo issue và review thật. Không điền minh chứng giả vào mẫu.
4. Kiểm tra cài mới từ ZIP trên thư mục khác/máy khác; chạy hai luồng demo.
5. Commit phiên bản cuối. Tạo tag `btl-nop-cuoi-ky` và GitHub Release; đính kèm gói mã nguồn đổi tên theo nhóm, ví dụ `BTL_Nhom05.zip`.
6. Nộp tên nhóm, đề tài, link Release, SHA commit đầy đủ và ZIP theo kênh/hạn giảng viên chỉ định. Bộ chấm kín nếu có nộp riêng.

## Đóng góp cá nhân — điền bằng chứng thật

| Thành viên / MSSV | Phần phụ trách | Issue / PR / commit | Cách giải thích và demo |
|---|---|---|---|
| Chưa cung cấp | Chưa xác nhận | Chưa có | Chưa có |

## Giới hạn

Web chạy local; không gửi email mời, không có khôi phục mật khẩu qua email, không hỗ trợ Figma/PSD, không realtime, không tự sửa ảnh. Người được thêm phải đăng ký trước. Lời mời hiện ở trang dự án và cần được người nhận chấp thuận. So sánh thanh chia yêu cầu cùng tỷ lệ ảnh. Bản giao chưa tạo GitHub repo/Release vì chưa có tài khoản/đích repo của nhóm.

## Dựng lại gói nộp từ mã nguồn

Chạy từ thư mục có README.md sau khi đã kiểm thử. Script chỉ lấy mã, tài liệu, ảnh mẫu và thư mục lưu trữ rỗng.

```bash
python3 scripts/package.py ../PixelNote-PHP-MySQL.zip
git rev-parse HEAD
```

Đổi tên ZIP theo yêu cầu của lớp khi đính kèm Release. Ghi lại mã commit ứng với bản ZIP để giảng viên có thể dựng đúng phiên bản. Nhóm điền thông tin thật vào bảng trên trước khi nộp.

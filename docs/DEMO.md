# Hai kịch bản trình bày

## 1. Một thiết kế qua hai vòng duyệt

1. Trên database mới đã nạp mẫu, đăng nhập designer bằng mật khẩu terminal đã in. Mở dự án Lumi và chọn màn hình **Trang chủ**, rồi chọn **Phiên bản 1** ở góc phải. Đọc ba góp ý theo thứ tự 1, 2, 3.
2. Chuyển sang reviewer bằng trình duyệt riêng. Chọn **Khoanh vùng**, kéo từ góc dưới phải về góc trên trái. Gửi góp ý rồi tải lại trang. Ghim vẫn ở vị trí cũ và có số 4. Lọc theo người viết hoặc tìm nội dung để kiểm tra số.
3. Designer dùng **Tải bản mới** để tải PNG hoặc JPEG. Dùng ảnh trong `database/demo-images` nếu cần. Góp ý đầu tiên của bản vừa tải là 1. Trở về bản 1 để đọc các góp ý cũ.
4. Mở **So sánh** và đối chiếu bản có lỗi với bản mới. Trong hai hộp chọn, phiên bản đã chọn bên kia được vô hiệu hóa. Ghi kết quả **Đạt** hoặc **Cần sửa tiếp**. Tải CSV ở trang dự án để xem phiên bản, số thứ tự, người viết và tọa độ.

## 2. Phân quyền, cộng tác và xóa có chủ đích

1. Đăng nhập viewer, mở Lumi. Có thể xem ảnh và lịch sử. Đăng nhập reviewer, thử mở đường dẫn ảnh Nomad do designer sao chép. Máy chủ từ chối truy cập.
2. Designer tạo một dự án riêng rồi chọn **Thành viên → Mời thành viên** bằng email của reviewer. Reviewer nhận lời trên trang danh sách dự án. Tạo ghi chú, đóng và mở lại, sau đó xem lịch sử.
3. Để minh họa xung đột, đăng nhập cùng tác giả ở hai phiên, mở hộp sửa cùng một ghi chú trước khi lưu ở phiên A. Lưu bản cũ ở phiên B. Bản nháp ở B được giữ để người dùng xem lại trước khi chọn ghi nội dung mới.
4. Chọn **Xóa góp ý**, bấm Hủy, tải lại và kiểm tra. Sau đó xác nhận xóa. Thêm góp ý khác để kiểm tra số mới không tái sử dụng. Với dự án vừa tạo, admin có thể chuyển chủ, gỡ thành viên hoặc mở cài đặt để xóa dự án.
5. Đăng nhập admin, kiểm tra danh sách người dùng, dự án và nhật ký. Trên một tài khoản thử, đổi email và mật khẩu qua **Tài khoản cá nhân** rồi đăng nhập lại bằng thông tin mới.


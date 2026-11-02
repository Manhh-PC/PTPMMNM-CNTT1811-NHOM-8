<?php require __DIR__ . '/../views/headers.php'; ?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#221f3a">
  <title>PixelNote · Không gian góp ý thiết kế</title>
  <link rel="icon" href="assets/logo.svg">
  <link rel="stylesheet" href="assets/home.css">
  <script defer src="assets/routes.js"></script>
</head>
<body>
  <header class="top"><a class="logo" href="index.php"><img src="assets/logo.svg" alt="">PixelNote</a>
    <nav aria-label="Điều hướng chính"><a href="login.php">Đăng nhập</a><a class="button light" href="register.php">Tạo tài khoản</a></nav>
  </header>
  <main>
    <section class="hero">
      <div class="copy"><p class="eyebrow"><span></span> PHÒNG DUYỆT THIẾT KẾ</p>
        <h1>Góp ý ngay<br>trên <em>bản thiết kế.</em></h1>
        <p>Ghim nhận xét vào đúng chi tiết, trao đổi cùng nhóm và mở hai phiên bản cạnh nhau để kiểm tra bản sửa.</p>
        <a class="button primary" href="projects.php">Mở không gian làm việc <b aria-hidden="true">→</b></a>
      </div>
      <figure><div class="board-head"><span class="dot"></span> Bảng duyệt <b>01 / 03</b></div>
        <div class="proof"><img src="assets/home-preview.png" alt="Bản thiết kế trang chủ Lumi với một ghim góp ý trên ảnh"><span class="pin">1</span></div>
        <figcaption><small>GÓP Ý #1 &nbsp; / &nbsp; PHIÊN BẢN 1</small><strong>Cho nút chính nổi bật hơn nhé.</strong><span class="status">Chưa xử lý</span></figcaption>
      </figure>
    </section>
    <section class="steps" aria-label="Quy trình làm việc">
      <article><small>01 / TẬP HỢP</small><h2>Tạo dự án</h2><p>Tập hợp các màn hình và phân quyền cho từng thành viên.</p></article>
      <article><small>02 / TRAO ĐỔI</small><h2>Đánh dấu trên ảnh</h2><p>Ghim một điểm hoặc khoanh cả vùng cần chỉnh sửa.</p></article>
      <article><small>03 / ĐỐI CHIẾU</small><h2>Kiểm tra bản mới</h2><p>Xem lại ghi chú của từng phiên bản và lưu kết quả kiểm tra.</p></article>
    </section>
  </main>
  <footer>PixelNote <span>Không gian cộng tác thiết kế</span></footer>
</body></html>

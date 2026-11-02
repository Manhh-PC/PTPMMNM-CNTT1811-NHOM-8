<?php
$pageTitle = 'Tạo tài khoản';
require __DIR__ . '/../views/form-start.php';
?>
<p class="eyebrow">KHÔNG GIAN PIXELNOTE</p>
<h1><?= $pageTitle ?></h1>
<p>Tạo tài khoản để bắt đầu dự án hoặc tham gia cùng nhóm.</p>
<form id="account-form" data-endpoint="register" method="post">
<label>Họ và tên<input name="name" autocomplete="name" minlength="2" maxlength="100" required></label>
<label>Địa chỉ email<input name="email" type="email" autocomplete="email" maxlength="190" required></label>
<label>Mật khẩu<input name="password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></label>
<label>Nhập lại mật khẩu <input name="password_confirm" type="password" autocomplete="new-password" required></label>
<p id="form-status" role="status" aria-live="polite"></p>
<button class="btn primary" type="submit" disabled>Tạo tài khoản</button>
</form>
<p class="auth-switch">Đã có tài khoản? <a href="login.php">Đăng nhập</a></p>
<?php require __DIR__ . '/../views/form-end.php'; ?>

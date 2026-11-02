<?php
$pageTitle = 'Tài khoản cá nhân';
require __DIR__ . '/../views/form-start.php';
?>
<p class="eyebrow">HỒ SƠ</p>
<h1><?= $pageTitle ?></h1>
<p>Cập nhật thông tin hiển thị và email dùng để đăng nhập.</p>
<form id="account-form" data-endpoint="profile.update" method="post">
<label>Họ và tên<input name="name" autocomplete="name" minlength="2" maxlength="100" required></label>
<label>Địa chỉ email<input name="email" type="email" autocomplete="email" maxlength="190" required></label>
<label>Mật khẩu hiện tại<input name="current_password" type="password" autocomplete="current-password" required></label>
<label>Mật khẩu mới<input name="new_password" type="password" minlength="8" maxlength="72" autocomplete="new-password"></label>
<label>Nhập lại mật khẩu mới<input name="password_confirm" type="password" autocomplete="new-password" ></label>
<p id="form-status" role="status" aria-live="polite"></p>
<button class="btn primary" type="submit" disabled>Lưu thay đổi</button>
</form>
<p class="auth-switch"><a href="projects.php">← Quay về dự án</a></p>
<?php require __DIR__ . '/../views/form-end.php'; ?>

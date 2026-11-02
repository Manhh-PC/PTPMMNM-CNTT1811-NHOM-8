<?php
$pageTitle = 'Đăng nhập';
require __DIR__ . '/../views/form-start.php';
?>
<p class="eyebrow">KHÔNG GIAN PIXELNOTE</p>
<h1><?= $pageTitle ?></h1>
<p>Đăng nhập để tiếp tục duyệt thiết kế cùng nhóm.</p>
<form id="account-form" data-endpoint="login" method="post">
<label>Địa chỉ email<input name="email" type="email" autocomplete="email" maxlength="190" required></label>
<label>Mật khẩu<input name="password" type="password" minlength="8" maxlength="72" autocomplete="current-password" required></label>

<p id="form-status" role="status" aria-live="polite"></p>
<button class="btn primary" type="submit" disabled>Đăng nhập</button>
</form>
<p class="auth-switch">Chưa có tài khoản? <a href="register.php">Đăng ký</a></p>
<?php require __DIR__ . '/../views/form-end.php'; ?>

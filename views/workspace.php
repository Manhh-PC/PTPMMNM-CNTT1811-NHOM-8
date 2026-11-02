<?php require __DIR__ . '/headers.php'; ?>
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#7255e7">
  <title><?= $pageTitle ?> · PixelNote</title>
  <link rel="icon" href="assets/logo.svg"><link rel="stylesheet" href="assets/app.css">
  <link rel="stylesheet" href="assets/admin.css">
  <?php foreach (['routes','geometry','comparison','app','pages/projects','pages/project','pages/review','pages/compare','admin','manage','workspace'] as $script): ?>
    <script defer src="assets/<?= $script ?>.js"></script>
  <?php endforeach; ?>
</head>
<body data-page="<?= $pageKey ?>">
  <div id="app"><div class="loading"><span class="spinner"></span>Đang mở không gian làm việc…</div></div>
  <div id="toast" role="status" aria-live="polite"></div>
  <dialog id="modal"></dialog>
  <noscript>Vui lòng bật JavaScript để sử dụng PixelNote.</noscript>
</body></html>

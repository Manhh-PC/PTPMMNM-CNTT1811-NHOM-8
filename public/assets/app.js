'use strict';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
const paths = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  folder: 'M3 7h6l2-3h9a1 1 0 0 1 1 1v14H3z',
  comment: 'M4 4h16v12H8l-4 4z',
  bell: 'M6 9a6 6 0 0 1 12 0v6l2 3H4l2-3zM10 21h4',
  search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M5 12h14M14 7l5 5-5 5',
  back: 'M19 12H5M10 7l-5 5 5 5',
  upload: 'M12 16V3M7 8l5-5 5 5M4 16v5h16v-5',
  image: 'M3 3h18v18H3zM3 16l5-5 5 5 3-3 5 5M15 7h.01',
  check: 'M5 12l4 4L19 6',
  chevron: 'M8 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  logout: 'M9 4H4v16h5M9 12h12M17 8l4 4-4 4',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  archive: 'M3 3h18v5H3zM5 8v13h14V8M9 12h6',
  users: 'M8 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6M2 21v-4a6 6 0 0 1 12 0v4M16 3a3 3 0 0 1 0 6M17 13a5 5 0 0 1 5 5v3',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l4 2',
  cursor: 'M5 3v17l5-5 4 7 3-2-4-7 7-1z',
  rect: 'M4 4h16v16H4z',
  minus: 'M5 12h14',
  fit: 'M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6',
  compare: 'M3 4h7v16H3zM14 4h7v16h-7z',
  download: 'M12 3v13M7 11l5 5 5-5M4 17v4h16v-4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  close: 'M6 6l12 12M18 6L6 18',
  edit: 'M14 4l6 6M4 20l5-1L21 7l-4-4L5 15z',
  refresh: 'M20 7v5h-5M4 17v-5h5M4 8a8 8 0 0 1 14-3l2 3M4 16l2 3a8 8 0 0 0 14-3',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 11v6M12 7h.01',
  send: 'M3 3l19 9-19 9 4-9zM7 12h15',
  file: 'M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8',
  shield: 'M12 2l8 4v7c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6',
  link: 'M10 13a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-3 3M14 11a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l3-3'
};
const ico = n => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n] || paths.file}"/></svg>`;
const noteNumber = t => Number(t.display_number);
const initials = n => String(n || '?').trim().split(/\s+/).slice(-2).map(x => x[0]).join('').toUpperCase();
const avatar = (name, cls = '') => `<span class="avatar ${cls}" aria-hidden="true">${esc(initials(name))}</span>`;
const roleName = r => ({
  owner: 'Chủ dự án',
  editor: 'Quản lý',
  reviewer: 'Góp ý',
  viewer: 'Chỉ xem'
})[r] || r;
const date = s => new Date(String(s).replace(' ', 'T') + '+07:00').toLocaleDateString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});
const datetime = s => new Date(String(s).replace(' ', 'T') + '+07:00').toLocaleString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});
const S = {
  user: null,
  csrf: '',
  projects: [],
  view: '',
  project: null,
  asset: null,
  version: null,
  threads: [],
  selected: 0,
  mode: 'cursor',
  zoom: 'fit',
  showPins: true,
  status: 'all',
  author: '',
  search: '',
  projectTab: 'designs',
  compareMode: 'side',
  notifications: [],
  load: 0
};
let toastTimer,
  previewURL,
  dragStart = null;
function toast(message, error = false) {
  const el = $('#toast');
  el.textContent = message;
  el.className = 'show' + (error ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.className = '', 5000);
}
async function api(action, data = null, params = {}) {
  const url = 'api.php?' + new URLSearchParams({
    action,
    ...params
  });
  const opt = {
    method: data === null ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: {}
  };
  if (data !== null) {
    opt.headers['X-CSRF-Token'] = S.csrf;
    if (data instanceof FormData) opt.body = data;else {
      opt.headers['Content-Type'] = 'application/json';
      opt.body = JSON.stringify(data);
    }
  }
  let res;
  try {
    res = await fetch(url, opt);
  } catch {
    throw new Error('Không kết nối được máy chủ. Kiểm tra Apache, MySQL và kết nối mạng.');
  }
  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error('Máy chủ trả dữ liệu không hợp lệ. Hãy kiểm tra nhật ký PHP.');
  }
  if (!res.ok || !body.ok) {
    const err = new Error(body.error || 'Yêu cầu chưa thành công.');
    err.status = res.status;
    if (res.status === 401 && S.user) {
      S.user = null;
      go('/login');
    }
    throw err;
  }
  return body.data;
}
function routeParts() {
  const params = new URLSearchParams(location.search);
  return {
    parts: [document.body.dataset.page, params.get('id')],
    params
  };
}
function go(route) {
  location.assign(pageUrl(route));
}
function authPage() {
  location.replace('login.php');
}
function canManage() {
  return S.project && ['owner', 'editor'].includes(S.project.role) && !Number(S.project.archived);
}
function canComment() {
  return S.project && S.project.role !== 'viewer' && !Number(S.project.archived);
}
const brand = () => '<a class="brand" href="projects.php" aria-label="PixelNote – Trang dự án"><img src="assets/logo.svg" alt=""><span>Pixel<span>Note</span></span></a>';
function errorView(message) {
  $('#app').innerHTML = `<div class="empty">${ico('info')}<h3>Chưa mở được trang</h3>
        <p>${esc(message)}</p>
        <a class="btn" href="projects.php">Về dự án</a> <button class="btn primary" data-action="reload">Thử lại</button>
        </div>`;
}
function shell(content, title = 'Tất cả dự án') {
  const archived = routeParts().params.get('archived') === '1';
  return `<aside class="sidebar">${brand()}<div class="workspace-name"><span class="workspace-logo">${ico('grid')}</span><span>Không gian làm việc</span>
        </div>
        <nav class="nav">${S.user.system_role === 'admin' ? `<a href="admin.php" class="${S.view === 'admin' ? 'current' : ''}">${ico('shield')}<span>Quản trị hệ thống</span>
        </a>` : ''}<a href="projects.php" class="${S.view === 'projects' && !archived ? 'current' : ''}">${ico('grid')}<span>Tất cả dự án</span><b class="badge">${S.projects.filter(p => !Number(p.archived)).length}</b>
        </a>
        <a href="projects.php?archived=1" class="${archived ? 'current' : ''}">${ico('archive')}<span>Đã lưu trữ</span>
        </a>
        <a href="help.php">${ico('info')}<span>Hướng dẫn sử dụng</span>
        </a>
        </nav>
        <div class="nav-label">Dự án gần đây</div>
        <nav class="nav project-nav">${S.projects.filter(p => !Number(p.archived)).slice(0, 5).map(p => `<a href="project.php?id=${p.id}" class="${S.project && S.project.id === p.id && S.view === 'project' ? 'current' : ''}"><i class="dot" style="background:${esc(p.color)}"></i><span>${esc(p.name.split(' · ')[0])}</span>
        </a>`).join('')}</nav>
        <div class="sidebar-help"><strong>Ý tưởng tốt hơn, cùng nhau.</strong><span class="muted">Ghim đúng vị trí. Góp ý rõ ràng. Hoàn thiện từng phiên bản.</span>
        <button data-action="help">Xem cách sử dụng →</button>
        </div>
        <div class="user-footer">
        <button data-action="profile">${avatar(S.user.name)}<span class="user-info"><strong>${esc(S.user.name)}</strong>
        <small>${S.user.system_role === 'admin' ? 'Quản trị viên hệ thống' : 'Tài khoản cá nhân'}</small></span>
        </button>
        <button class="icon-btn" data-action="logout" aria-label="Đăng xuất" title="Đăng xuất">${ico('logout')}</button>
        </div>
        </aside>
        <main class="main">
        <header class="topbar">
        <div class="crumb">Không gian làm việc<span>/</span><strong>${esc(title)}</strong>
        </div>
        <div class="spacer">
        </div>
        <div class="top-actions">
        <button class="icon-btn notification" data-action="notifications" aria-label="Thông báo">${ico('bell')}${S.notifications.some(n => !Number(n.is_read)) ? '<i class="unread"></i>' : ''}</button>
        <button data-action="profile" aria-label="Tài khoản">${avatar(S.user.name, 'purple')}</button>
        </div>
        </header>${content}</main>`;
}
function empty(title, body, action = '') {
  return `<div class="empty">${ico('comment')}<h3>${esc(title)}</h3>
        <p>${esc(body)}</p>${action}</div>`;
}
function timeline(rows) {
  return rows.length ? `<div class="timeline">${rows.map(r => `<div class="timeline-item"><span class="time-dot"></span>
        <div><strong>${esc(r.author_name)}</strong> <small>· ${datetime(r.created_at)}</small>
        <p>${esc(r.message || {
    created: 'Tạo góp ý',
    edited: 'Sửa nội dung',
    resolved: 'Đánh dấu đã xử lý',
    reopened: 'Mở lại góp ý'
  }[r.action] || r.action)}</p>${r.action === 'edited' ? `<p>
        <small>Trước: ${esc(r.old_body)}</small><br>Sau: ${esc(r.new_body)}</p>` : ''}</div>
        </div>`).join('')}</div>` : empty('Chưa có hoạt động', 'Các thay đổi sẽ được ghi lại tại đây.');
}
function modal(title, body) {
  if (previewURL) {
    URL.revokeObjectURL(previewURL);
    previewURL = null;
  }
  const d = $('#modal');
  d.innerHTML = `<div class="modal-header">
        <h2>${esc(title)}</h2>
        <button class="icon-btn" data-action="close-modal" aria-label="Đóng">${ico('close')}</button>
        </div>
        <div class="modal-body">${body}</div>`;
  if (!d.open) d.showModal();
}
const formEnd = (label = 'Lưu thay đổi') => `<div class="error-box" role="alert">
        </div>
        <div class="modal-footer">
        <button type="button" class="btn" data-action="close-modal">Hủy</button>
        <button class="btn primary" type="submit">${esc(label)}</button>
        </div>`;
function helpBody() {
  return `<div class="help-list">
        <div><strong>Quản trị hệ thống</strong>
        <p>Admin có trang quản lý người dùng, dự án và nhật ký riêng. <a href="guide.php#admin" target="_blank" rel="noopener">Xem hướng dẫn cập nhật và tạo admin đầu tiên ↗</a>
        </p>
        </div>
        <div><strong>01 · Bắt đầu từ một dự án</strong>
        <p>Tạo dự án, thêm thành viên bằng email đã đăng ký và chọn quyền: chỉ xem, góp ý hoặc quản lý.</p>
        </div>
        <div><strong>02 · Góp ý đúng vị trí</strong>
        <p>Mở ảnh → chọn công cụ điểm <code>C</code> hoặc vùng <code>R</code> → bấm hoặc kéo trên ảnh → nhập nhận xét. Di chuột hoặc chạm vào ghim để xem note.</p>
        </div>
        <div><strong>03 · Trao đổi và theo dõi</strong>
        <p>Trả lời, sửa nội dung của chính mình, đóng hoặc mở lại góp ý. Nếu có người sửa trước, ứng dụng báo xung đột và giữ nội dung bạn đang nhập.</p>
        </div>
        <div><strong>04 · So sánh sau khi sửa</strong>
        <p>Tải phiên bản mới, chọn “So sánh” và đối chiếu hai bản. Góp ý cũ luôn thuộc bản cũ. Lưu kết quả kiểm tra hoặc xuất CSV từ trang dự án.</p>
        </div>
        <div><strong>Phím tắt</strong>
        <p><code>V</code> chọn · <code>C</code> ghim điểm · <code>R</code> khoanh vùng · <code>+</code> / <code>-</code> thu phóng · <code>0</code> vừa màn hình.</p>
        </div>
        <div>
        <a href="guide.php" target="_blank" rel="noopener">Đọc hướng dẫn cài đặt và chạy trên Windows ↗</a>
        </div>
        </div>`;
}

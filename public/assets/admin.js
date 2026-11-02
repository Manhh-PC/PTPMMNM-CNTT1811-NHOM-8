'use strict';

const adminRole = r => r === 'admin' ? 'Quản trị viên' : 'Người dùng';
const adminActions = {
  'user.delete': 'Xóa tài khoản',
  'user.edit': 'Sửa hồ sơ',
  'project.delete': 'Xóa dự án',
  'admin.bootstrap': 'Khởi tạo admin đầu tiên',
  'user.role': 'Đổi quyền hệ thống',
  'user.status': 'Khóa / mở tài khoản',
  'project.lock': 'Khóa dự án',
  'project.restore': 'Mở lại dự án'
};
const adminBadge = (label, kind = '') => `<span class="badge ${kind}">${esc(label)}</span>`;
function adminPager(data, params) {
  const pages = Math.max(1, Math.ceil(data.total / data.page_size));
  function link(page, label) {
    const q = new URLSearchParams(params);
    q.set('page', page);
    return `<a class="btn small" href="admin.php?${esc(q.toString())}">${label}</a>`;
  }
  return `<div class="admin-pager"><span>${data.total} kết quả · Trang ${data.page}/${pages}</span>
        <div class="flex">${data.page > 1 ? link(data.page - 1, '← Trước') : ''}${data.page < pages ? link(data.page + 1, 'Sau →') : ''}</div>
        </div>`;
}
function adminFilter(tab, params) {
  const q = params.get('q') || '',
    role = params.get('role') || 'all',
    status = params.get('status') || 'all';
  const option = (value, text, current) => `<option value="${value}" ${current === value ? 'selected' : ''}>${text}</option>`;
  return `<form data-admin-filter class="admin-filter">
        <input type="hidden" name="tab" value="${tab}">
        <label class="admin-search">Tìm kiếm<input name="q" maxlength="100" value="${esc(q)}" placeholder="${tab === 'users' ? 'Tên hoặc email' : 'Tên dự án hoặc chủ dự án'}">
        </label>${tab === 'users' ? `<label>Quyền hệ thống<select name="role">${option('all', 'Tất cả quyền', role)}${option('admin', 'Quản trị viên', role)}${option('user', 'Người dùng', role)}</select>
        </label>` : ''}<label>Trạng thái<select name="status">${option('all', 'Tất cả trạng thái', status)}${option('active', 'Đang hoạt động', status)}${tab === 'users' ? option('blocked', 'Đã khóa', status) : option('archived', 'Đã lưu trữ', status) + option('locked', 'Admin đã khóa', status)}</select>
        </label>
        <button class="btn primary" type="submit">${ico('search')} Tìm kiếm</button>
        <a class="btn" href="admin.php?tab=${tab}">Xóa lọc</a>
        </form>`;
}
function adminUsers(data, params) {
  return adminFilter('users', params) + (data.items.length ? `<div class="table-wrap">
        <table class="data-table admin-table">
        <thead>
        <tr>
        <th>Người dùng</th>
        <th>Quyền hệ thống</th>
        <th>Trạng thái</th>
        <th>Dự án sở hữu</th>
        <th>Thao tác</th>
        </tr>
        </thead>
        <tbody>${data.items.map(u => `<tr>
        <td><strong>${esc(u.name)}</strong>${Number(u.id) === Number(S.user.id) ? ' <small>(Bạn)</small>' : ''}<small class="admin-email">${esc(u.email)}</small>
        <small>Tham gia ${date(u.created_at)}</small>
        </td>
        <td>${adminBadge(adminRole(u.system_role), u.system_role === 'admin' ? '' : 'gray')}</td>
        <td>${adminBadge(Number(u.is_active) ? 'Hoạt động' : 'Đã khóa', Number(u.is_active) ? 'green' : 'orange')}</td>
        <td>${Number(u.owned_projects)}</td>
        <td>
        <div class="admin-row-actions">
        <button class="btn small" data-action="admin-edit" data-id="${u.id}">Sửa</button>
        <button class="btn small danger" data-action="admin-delete" data-id="${u.id}" ${Number(u.id) === Number(S.user.id) ? 'disabled' : ''}>Xóa</button>
        <button class="btn small" data-action="admin-role" data-id="${u.id}">${u.system_role === 'admin' ? 'Gỡ quyền admin' : 'Cấp quyền admin'}</button>
        <button class="btn small ${Number(u.is_active) ? 'danger' : ''}" data-action="admin-status" data-id="${u.id}" ${Number(u.id) === Number(S.user.id) ? 'disabled title="Không thể khóa chính bạn"' : ''}>${Number(u.is_active) ? 'Khóa tài khoản' : 'Mở tài khoản'}</button>
        </div>
        </td>
        </tr>`).join('')}</tbody>
        </table>
        </div>` : empty('Không tìm thấy người dùng', 'Thử thay đổi từ khóa hoặc bộ lọc.')) + adminPager(data, params);
}
function adminProjects(data, params) {
  return adminFilter('projects', params) + (data.items.length ? `<div class="table-wrap">
        <table class="data-table admin-table">
        <thead>
        <tr>
        <th>Dự án</th>
        <th>Chủ dự án</th>
        <th>Trạng thái</th>
        <th>Quy mô</th>
        <th>Thao tác</th>
        </tr>
        </thead>
        <tbody>${data.items.map(p => `<tr>
        <td><strong>${esc(p.name)}</strong>
        <small class="admin-email">Cập nhật ${datetime(p.updated_at)}</small>
        </td>
        <td>${esc(p.owner_name)}<small class="admin-email">${esc(p.owner_email)}</small>
        </td>
        <td>${adminBadge(Number(p.admin_locked) ? 'Admin đã khóa' : Number(p.archived) ? 'Đã lưu trữ' : 'Hoạt động', Number(p.archived) ? 'orange' : 'green')}</td>
        <td>${Number(p.asset_count)} ảnh<br>
        <small>${Number(p.member_count)} thành viên</small>
        </td>
        <td>
        <div class="admin-row-actions">
        <a class="btn small" href="project.php?id=${p.id}">${ico('eye')} Xem</a>
        <button class="btn small ${Number(p.archived) ? '' : 'danger'}" data-action="admin-archive" data-id="${p.id}">${Number(p.archived) ? 'Mở lại' : 'Khóa dự án'}</button>
        </div>
        </td>
        </tr>`).join('')}</tbody>
        </table>
        </div>` : empty('Không tìm thấy dự án', 'Thử thay đổi từ khóa hoặc bộ lọc.')) + adminPager(data, params);
}
function adminAudit(data, params) {
  return (data.items.length ? `<div class="table-wrap">
        <table class="data-table admin-table">
        <thead>
        <tr>
        <th>Thời điểm</th>
        <th>Người thực hiện</th>
        <th>Thao tác</th>
        <th>Đối tượng và chi tiết</th>
        </tr>
        </thead>
        <tbody>${data.items.map(row => {
    let d = {};
    try {
      d = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
    } catch {}
    return `<tr>
        <td>${datetime(row.created_at)}</td>
        <td>${esc(row.actor_name || 'Tài khoản không còn tồn tại')}<small class="admin-email">${esc(row.actor_email || '')}</small>
        </td>
        <td>${esc(adminActions[row.action] || row.action)}</td>
        <td><strong>${esc(d.name || d.email || '')} · #${Number(row.object_id)}</strong>${d.before ? `<p class="admin-detail">Trước: ${esc(adminAuditState(d.before))}<br>Sau: ${esc(adminAuditState(d.after))}</p>` : '<p class="admin-detail">Thao tác đã được ghi nhận.</p>'}</td>
        </tr>`;
  }).join('')}</tbody>
        </table>
        </div>` : empty('Chưa có nhật ký', 'Các thao tác quản trị sẽ được ghi lại tại đây.')) + adminPager(data, params);
}
function adminAuditState(s) {
  if (!s) return '';
  if ('system_role' in s) return adminRole(s.system_role) + ' · ' + (Number(s.is_active) ? 'hoạt động' : 'đã khóa');
  return Number(s.admin_locked) ? 'Admin đã khóa' : Number(s.archived) ? 'Đã lưu trữ' : 'Hoạt động';
}
async function adminPage(params) {
  const tab = ['overview', 'users', 'projects', 'audit'].includes(params.get('tab')) ? params.get('tab') : 'overview';
  const query = Object.fromEntries(params);
  delete query.tab;
  const [summary, data] = await Promise.all([api('admin.summary'), tab === 'overview' ? Promise.resolve(null) : api('admin.' + tab, null, query)]);
  S.view = 'admin';
  S.project = null;
  S.admin = {
    tab,
    summary,
    data
  };
  const tabs = [['overview', 'Tổng quan', 'grid'], ['users', 'Người dùng', 'users'], ['projects', 'Dự án', 'folder'], ['audit', 'Nhật ký', 'clock']];
  let content = '';
  if (tab === 'overview') {
    const stats = [['users', summary.users.total, 'Tổng người dùng'], ['shield', summary.users.admins, 'Admin đang hoạt động'], ['folder', summary.projects.total, 'Dự án toàn hệ thống'], ['comment', summary.open_threads, 'Góp ý chưa xử lý']];
    content = `<div class="stats admin-stats">${stats.map(([icon, n, label]) => `<div class="stat"><span class="stat-icon">${ico(icon)}</span>
        <div><strong>${Number(n)}</strong>
        <small>${label}</small>
        </div>
        </div>`).join('')}</div>
        <div class="admin-overview">
        <article>
        <h2>Quản lý tài khoản</h2>
        <p>${summary.users.active} tài khoản hoạt động · ${summary.users.total - summary.users.active} tài khoản đã khóa.</p>
        <p>Khóa tài khoản sẽ thu hồi các phiên đăng nhập. Tài khoản mới đăng ký luôn là người dùng thường.</p>
        <a class="btn" href="admin.php?tab=users">Mở danh sách người dùng ${ico('arrow')}</a>
        </article>
        <article>
        <h2>Quản lý dự án</h2>
        <p>${summary.projects.archived} dự án lưu trữ, trong đó ${summary.projects.locked} dự án do admin khóa · ${summary.assets} màn hình thiết kế.</p>
        <p>Admin có thể xem mọi dự án. Mở một dự án để quản lý thành viên, thiết kế, phiên bản và góp ý.</p>
        <a class="btn" href="admin.php?tab=projects">Mở danh sách dự án ${ico('arrow')}</a>
        </article>
        </div>
        <p class="admin-note">Quyền admin áp dụng toàn hệ thống. Trong một dự án đang hoạt động, admin có thể quản lý cả nội dung và thành viên.</p>`;
  } else if (tab === 'users') content = adminUsers(data, params);else if (tab === 'projects') content = adminProjects(data, params);else content = adminAudit(data, params);
  $('#app').innerHTML = shell(`<section class="page admin-page">
        <div class="page-intro between">
        <div>
        <div class="eyebrow">QUẢN TRỊ HỆ THỐNG</div>
        <h1>Trung tâm quản trị</h1>
        <p>Quản lý tài khoản, dự án và theo dõi các thay đổi trên PixelNote.</p>
        </div>
        <button class="btn" data-action="reload">${ico('refresh')} Làm mới</button>
        </div>
        <nav class="tabs admin-tabs" aria-label="Chức năng quản trị">${tabs.map(([value, label, icon]) => `<a class="tab ${tab === value ? 'active' : ''}" href="admin.php?tab=${value}">${ico(icon)} ${label}</a>`).join('')}</nav>${content}</section>`, 'Quản trị hệ thống');
}
function handleAdminAction(el) {
  const id = Number(el.dataset.id),
    action = el.dataset.action;
  const target = S.admin?.data?.items.find(x => Number(x.id) === id);
  if (!target) return;
  if (action === 'admin-edit') {
    modal('Chỉnh sửa tài khoản', `<form data-form="admin.user.edit">
        <input type="hidden" name="id" value="${id}">${field('name', 'Họ và tên', target.name)}${field('email', 'Email', target.email, 'email')}<label>Mật khẩu mới (tùy chọn)<input name="new_password" type="password" minlength="8" maxlength="72" autocomplete="new-password">
        </label>${formEnd()}</form>`);
    return;
  }
  let apiAction, payload, title, message;
  if (action === 'admin-delete') {
    apiAction = 'admin.user.delete';
    payload = {
      id,
      confirmed: true
    };
    title = 'Xóa tài khoản';
    message = 'Xóa danh tính và quyền truy cập của người này. Lịch sử góp ý sẽ hiển thị dưới tên Tài khoản đã xóa. Thao tác này không thể hoàn tác.';
  } else if (action === 'admin-role') {
    apiAction = 'admin.user.role';
    payload = {
      id,
      system_role: target.system_role === 'admin' ? 'user' : 'admin'
    };
    title = payload.system_role === 'admin' ? 'Cấp quyền quản trị hệ thống' : 'Gỡ quyền quản trị';
    message = payload.system_role === 'admin' ? 'Người này có thể quản lý tài khoản, xem toàn bộ dự án và cấp quyền admin cho người khác.' : 'Các quyền thành viên trong dự án vẫn được giữ. Hệ thống không cho gỡ admin đang hoạt động cuối cùng.';
  } else if (action === 'admin-status') {
    apiAction = 'admin.user.status';
    payload = {
      id,
      is_active: !Number(target.is_active)
    };
    title = payload.is_active ? 'Mở lại tài khoản' : 'Khóa tài khoản';
    message = payload.is_active ? 'Người dùng cần đăng nhập lại để sử dụng.' : 'Người dùng sẽ không đăng nhập được; mọi phiên cũ bị thu hồi. Dự án, ảnh và góp ý được giữ nguyên.';
  } else if (action === 'admin-archive') {
    apiAction = 'admin.project.archive';
    payload = {
      id,
      archived: !Number(target.archived)
    };
    title = payload.archived ? 'Khóa và lưu trữ dự án' : 'Mở lại dự án';
    message = payload.archived ? 'Thành viên vẫn xem được nội dung nhưng không thể sửa, đăng góp ý hoặc tải phiên bản. Chỉ admin có thể mở lại dự án bị khóa.' : 'Dự án trở lại hoạt động, các quyền thành viên giữ nguyên.';
  } else return;
  S.adminPending = {
    action: apiAction,
    payload
  };
  modal(title, `<form data-admin-confirm>
        <p><strong>${esc(target.name)}</strong>${target.email ? `<br>${esc(target.email)}` : ''}</p>
        <p class="admin-confirm">${esc(message)}</p>
        <div class="error-box" role="alert">
        </div>
        <div class="modal-footer">
        <button type="button" class="btn" data-action="close-modal">Hủy</button>
        <button class="btn primary" type="submit">Xác nhận</button>
        </div>
        </form>`);
}
document.addEventListener('submit', async e => {
  const form = e.target;
  if (form.hasAttribute('data-admin-filter')) {
    e.preventDefault();
    go('/admin?' + new URLSearchParams(new FormData(form)));
    return;
  }
  if (!form.hasAttribute('data-admin-confirm')) return;
  e.preventDefault();
  const button = $('[type=submit]', form),
    error = $('.error-box', form),
    pending = S.adminPending;
  if (!pending) return;
  button.disabled = true;
  error.style.display = 'none';
  try {
    await api(pending.action, pending.payload);
    S.adminPending = null;
    $('#modal').close();
    const session = await api('session');
    S.user = session.user;
    S.csrf = session.csrf;
    toast('Đã cập nhật. Thao tác được ghi vào nhật ký quản trị.');
    if (S.user?.system_role !== 'admin') go('/projects');else await render();
  } catch (err) {
    error.textContent = err.message;
    error.style.display = 'block';
  } finally {
    button.disabled = false;
  }
});

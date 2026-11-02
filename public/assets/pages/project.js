'use strict';

async function projectPage(id) {
  const p = await api('project', null, {
    id
  });
  S.project = p;
  S.view = 'project';
  $('#app').innerHTML = shell(`<section class="page">
        <div class="page-intro between">
        <div>
        <div class="eyebrow">DỰ ÁN THIẾT KẾ</div>
        <h1>${esc(p.name)}</h1>
        <p>${esc(p.description) || 'Cùng nhau hoàn thiện từng chi tiết.'}</p>
        </div>
        <div class="flex">
        <button class="btn" data-action="members">${ico('users')} Thành viên</button>
        <button class="icon-btn" data-action="project-settings" aria-label="Cài đặt dự án">${ico('settings')}</button>
        </div>
        </div>${p.system_admin ? '<p class="admin-note">Bạn đang quản trị dự án này với quyền quản trị viên hệ thống.</p>' : ''}${Number(p.admin_locked) ? '<p class="admin-note">Dự án bị admin khóa. Chỉ quản trị viên hệ thống có thể mở lại.</p>' : ''}${Number(p.archived) ? '<div class="alert" style="margin-top:20px">Dự án đã được lưu trữ. Bạn vẫn có thể xem ảnh, lịch sử và xuất góp ý.</div>' : ''}<div class="tabs">
        <button class="tab ${S.projectTab === 'designs' ? 'active' : ''}" data-action="project-tab" data-tab="designs">Màn hình thiết kế (${p.assets.length})</button>
        <button class="tab ${S.projectTab === 'notes' ? 'active' : ''}" data-action="project-tab" data-tab="notes">Tất cả góp ý</button>
        <button class="tab ${S.projectTab === 'activity' ? 'active' : ''}" data-action="project-tab" data-tab="activity">Hoạt động</button>
        </div>
        <div id="project-content">
        </div>
        </section>`, p.name.split(' · ')[0]);
  await renderProjectContent();
}
async function renderProjectContent() {
  const p = S.project;
  const el = $('#project-content');
  if (!el) return;
  if (S.projectTab === 'designs') {
    el.innerHTML = `<div class="section-bar between">
        <div>
        <h2>Mọi màn hình, cùng một nơi</h2>
        <p class="muted" style="font-size:12px;margin-top:7px">Chọn một thiết kế để xem và trao đổi.</p>
        </div>${canManage() ? `<button class="btn primary" data-action="upload-asset">${ico('upload')} Tải ảnh lên</button>` : ''}</div>
        <div class="card-grid">${p.assets.map(a => `<a class="asset-card" href="review.php?id=${a.id}">
        <div class="cover">
        <img src="image.php?id=${a.latest_id}" alt="${esc(a.name)}" loading="lazy"><span class="badge">v${a.latest_version_number}</span>
        </div>
        <div class="card-info">
        <h3>${esc(a.name)}</h3>
        <p>${a.version_count} phiên bản · PNG / JPEG</p>
        <div class="card-footer"><span>${ico('comment')} ${a.open_count} góp ý đang mở</span><span>${date(a.updated_at)}</span>
        </div>
        </div>
        </a>`).join('')}${canManage() ? '<button class="new-card" data-action="upload-asset"><span class="plus-circle">' + ico('upload') + '</span><strong>Thêm màn hình thiết kế</strong><p>PNG hoặc JPEG · Tối đa 15 MB</p></button>' : ''}${!p.assets.length && !canManage() ? empty('Chưa có ảnh thiết kế', 'Người quản lý sẽ tải ảnh để mọi người cùng xem.') : ''}</div>`;
  } else if (S.projectTab === 'notes') {
    S.projectThreads = await api('threads', null, {
      project_id: p.id
    });
    el.innerHTML = `<div class="section-bar between">
        <div class="flex" style="flex-wrap:wrap">
        <div class="search">${ico('search')}<input id="notes-search" placeholder="Tìm nội dung góp ý…" aria-label="Tìm góp ý">
        </div>
        <select id="notes-status" aria-label="Lọc trạng thái"><option value="all">Mọi trạng thái</option><option value="open">Chưa xử lý</option><option value="resolved">Đã xử lý</option>
        </select>
        <select id="notes-author" aria-label="Lọc người góp ý"><option value="">Mọi người</option>${p.members.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select>
        </div>
        <button class="btn" data-action="export-project">${ico('download')} Xuất CSV</button>
        </div>
        <div id="notes-table">
        </div>`;
    renderNotesTable();
  } else {
    const rows = await api('activity', null, {
      project_id: p.id
    });
    el.innerHTML = `<div class="table-wrap" style="padding:22px 26px">
        <h2 style="margin-bottom:20px">Lịch sử hoạt động</h2>${timeline(rows)}</div>`;
  }
}
function renderNotesTable() {
  const q = ($('#notes-search')?.value || '').toLocaleLowerCase('vi');
  const status = $('#notes-status')?.value;
  const author = $('#notes-author')?.value;
  const rows = S.projectThreads.filter(t => (!q || (t.body + ' ' + t.asset_name + ' ' + t.author_name).toLocaleLowerCase('vi').includes(q)) && (!status || status === 'all' || t.status === status) && (!author || String(t.author_id) === author));
  $('#notes-table').innerHTML = rows.length ? `<div class="table-wrap">
        <table class="data-table">
        <thead>
        <tr>
        <th>Góp ý</th>
        <th>Màn hình</th>
        <th>Người viết</th>
        <th>Trạng thái</th>
        <th>
        </th>
        </tr>
        </thead>
        <tbody>${rows.map(t => `<tr>
        <td class="note-text">
        <a href="review.php?id=${t.asset_id}&v=${t.version_id}&thread=${t.id}"><b>#${noteNumber(t)}</b> ${esc(t.body)}</a>
        </td>
        <td>${esc(t.asset_name)}<br>
        <small>v${t.version_number} · ${t.kind === 'point' ? 'Điểm' : 'Vùng'}</small>
        </td>
        <td>${esc(t.author_name)}</td>
        <td><span class="badge ${t.status === 'resolved' ? 'green' : 'orange'}">${t.status === 'resolved' ? 'Đã xử lý' : 'Chưa xử lý'}</span>
        </td>
        <td>
        <a href="review.php?id=${t.asset_id}&v=${t.version_id}&thread=${t.id}" aria-label="Mở góp ý ${noteNumber(t)}">${ico('chevron')}</a>
        </td>
        </tr>`).join('')}</tbody>
        </table>
        </div>` : empty('Không có góp ý phù hợp', 'Thử thay đổi bộ lọc hoặc tạo góp ý trên một ảnh thiết kế.');
}

'use strict';

function dashboard() {
  S.view = 'projects';
  S.project = null;
  const archived = routeParts().params.get('archived') === '1';
  const active = S.projects.filter(p => Boolean(Number(p.archived)) === archived);
  $('#app').innerHTML = shell(`<section class="page">
        <div class="page-intro between">
        <div>
        <div class="eyebrow">KHÔNG GIAN SÁNG TẠO CỦA BẠN</div>
        <h1>${archived ? 'Dự án đã lưu trữ' : 'Chào ' + esc(S.user.name.split(' ').slice(-1)[0]) + ', cùng tạo điều tốt hơn.'}</h1>
        <p>${archived ? 'Xem lại thiết kế và khôi phục dự án khi cần.' : 'Tất cả thiết kế, góp ý và phiên bản — trong một không gian.'}</p>
        </div>
        <button class="btn primary" data-action="new-project">${ico('plus')} Tạo dự án</button>
        </div>${archived ? '' : `<div class="welcome-banner">
        <div>
        <h2>Đúng vị trí. Rõ ý tưởng.</h2>
        <p>Đặt một ghim trên thiết kế và bắt đầu cuộc trao đổi.<br>Mọi góp ý được lưu lại, để mỗi phiên bản đều tiến một bước.</p>
        </div>
        <div class="mini-art">
        <div class="sheet">
        </div>
        <div class="bubble">${ico('comment')}</div>
        <div class="check">${ico('check')}</div>
        </div>
        </div>
        <div class="stats">
        <div class="stat"><span class="stat-icon">${ico('folder')}</span>
        <div><strong>${active.length}</strong>
        <small>Dự án đang thực hiện</small>
        </div>
        </div>
        <div class="stat"><span class="stat-icon">${ico('comment')}</span>
        <div><strong>${active.reduce((n, p) => n + Number(p.open_count), 0)}</strong>
        <small>Góp ý cần xử lý</small>
        </div>
        </div>
        <div class="stat"><span class="stat-icon">${ico('image')}</span>
        <div><strong>${active.reduce((n, p) => n + Number(p.asset_count), 0)}</strong>
        <small>Màn hình thiết kế</small>
        </div>
        </div>
        </div>`}<div class="section-bar between">
        <h2>${archived ? 'Kho lưu trữ' : 'Dự án của bạn'}</h2>
        <div class="flex">
        <div class="search">${ico('search')}<input id="project-search" placeholder="Tìm tên dự án…" aria-label="Tìm dự án">
        </div>
        <select id="project-sort" aria-label="Sắp xếp dự án"><option value="recent">Mới cập nhật</option><option value="name">Tên A → Z</option>
        </select>
        </div>
        </div>
        <div class="card-grid" id="project-grid">${projectCards(active, archived)}</div>
        <p class="muted" style="font-size:10px;margin-top:25px">${ico('shield')} Thành viên được cấp quyền và quản trị viên hệ thống có thể xem thiết kế, góp ý của dự án.</p>
        </section>`, archived ? 'Đã lưu trữ' : 'Tất cả dự án');
}
function projectCards(projects, archived = false) {
  return projects.map(p => `<a class="project-card" href="project.php?id=${p.id}">
        <div class="cover ${p.cover_id ? '' : 'placeholder'}" style="background:${esc(p.color)}12">${p.cover_id ? `<img src="image.php?id=${p.cover_id}" alt="Ảnh đại diện dự án ${esc(p.name)}" loading="lazy">` : ico('folder')}<span class="badge">${esc(roleName(p.role))}</span>
        </div>
        <div class="card-info">
        <h3>${esc(p.name)}</h3>
        <p>${p.asset_count} màn hình · ${p.open_count} góp ý đang mở</p>
        <div class="card-footer">
        <div class="flex" style="gap:6px">${ico('users')} ${p.member_count} thành viên</div><span>${date(p.updated_at)}</span>
        </div>
        </div>
        </a>`).join('') + (archived ? projects.length ? '' : empty('Chưa có dự án lưu trữ', 'Các dự án được lưu trữ sẽ xuất hiện tại đây.') : '<button class="new-card" data-action="new-project"><span class="plus-circle">' + ico('plus') + '</span><strong>Bắt đầu một dự án mới</strong><p>Mời mọi người cùng góp ý</p></button>');
}

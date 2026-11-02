'use strict';

async function refreshThreads() {
  S.threads = await api('threads', null, {
    project_id: S.project.id,
    version_id: S.version.id
  });
}
function visibleThreads() {
  return S.threads.filter(t => (S.status === 'all' || t.status === S.status) && (!S.author || String(t.author_id) === S.author) && (!S.search || (t.body + ' ' + t.author_name).toLocaleLowerCase('vi').includes(S.search.toLocaleLowerCase('vi'))));
}
function pins(rows) {
  return rows.map(t => {
    const pin = `<button class="pin ${t.status === 'resolved' ? 'resolved' : ''} ${Number(t.id) === Number(S.selected) ? 'selected' : ''}" data-action="select-thread" data-id="${t.id}" aria-label="Góp ý ${noteNumber(t)}" style="${t.kind === 'point' ? `left:${Number(t.x) * 100}%;top:${Number(t.y) * 100}%;` : ''}">${noteNumber(t)}<span class="pin-tooltip ${Number(t.x) > .65 ? 'flip' : ''} ${Number(t.y) > .65 ? 'up' : ''}"><b>${esc(t.author_name)} · ${t.status === 'resolved' ? 'Đã xử lý' : 'Chưa xử lý'}</b>${esc(t.body)}</span>
        </button>`;
    return t.kind === 'point' ? pin : `<div class="annotation-region ${t.status === 'resolved' ? 'resolved' : ''}" data-action="select-thread" data-id="${t.id}" style="left:${Number(t.x) * 100}%;top:${Number(t.y) * 100}%;width:${Number(t.w) * 100}%;height:${Number(t.h) * 100}%">${pin}</div>`;
  }).join('');
}
function threadCards() {
  return visibleThreads().map(t => `<article class="comment-card ${Number(t.id) === Number(S.selected) ? 'selected' : ''}" id="thread-${t.id}">
        <div class="comment-top" data-action="select-thread" data-id="${t.id}">${avatar(t.author_name)}<div>
        <div class="comment-author">${esc(t.author_name)}</div>
        <div class="comment-date">${datetime(t.created_at)}</div>
        </div><span class="comment-number">#${noteNumber(t)}</span>
        </div>
        <p class="comment-body" data-action="select-thread" data-id="${t.id}">${esc(t.body)}</p>
        <div class="comment-bottom">${ico(t.status === 'resolved' ? 'check' : 'comment')}${t.status === 'resolved' ? 'Đã xử lý' : 'Chưa xử lý'} · ${t.replies.length} trả lời</div>${Number(t.id) === Number(S.selected) ? `<div class="comment-actions">${canComment() ? `<button data-action="thread-status" data-id="${t.id}">${t.status === 'resolved' ? 'Mở lại' : 'Đánh dấu đã xử lý'}</button>${Number(t.author_id) === Number(S.user.id) || S.user.system_role === 'admin' ? `<button data-action="edit-thread" data-id="${t.id}">Sửa</button>` : ''}` : ''}${canComment() && (canManage() || Number(t.author_id) === Number(S.user.id)) ? actionButton('delete-thread', 'Xóa góp ý', 'data-id="' + t.id + '"') : ''}<button data-action="history" data-id="${t.id}">Lịch sử</button>
        </div>${t.replies.map(r => `<div class="reply"><strong>${esc(r.author_name)}</strong>
        <p>${esc(r.body)}</p>${canComment() && (Number(r.author_id) === Number(S.user.id) || S.user.system_role === 'admin') ? `<button class="edit-reply" data-action="edit-reply" data-id="${r.id}">Sửa trả lời</button>` : ''}${canComment() && (canManage() || Number(r.author_id) === Number(S.user.id)) ? actionButton('delete-reply', 'Xóa trả lời', 'data-id="' + r.id + '"') : ''}</div>`).join('')}${canComment() ? `<form class="reply-form" data-form="reply.create">
        <input type="hidden" name="thread_id" value="${t.id}"><textarea name="body" required maxlength="5000" placeholder="Viết trả lời…" aria-label="Nội dung trả lời"></textarea>
        <div class="error-box">
        </div>
        <button class="btn primary small">Gửi trả lời</button>
        </form>` : ''}` : ''}</article>`).join('') || empty('Chưa có góp ý phù hợp', 'Chọn công cụ ghim hoặc khoanh vùng để bắt đầu.');
}
function paintThreads() {
  if ($('#comment-list')) $('#comment-list').innerHTML = threadCards();
  if ($('#pins')) $('#pins').innerHTML = S.showPins ? pins(visibleThreads()) : '';
}
async function reviewPage(id, params, compare = false) {
  S.asset = await api('asset', null, {
    id
  });
  S.project = await api('project', null, {
    id: S.asset.project_id
  });
  S.view = compare ? 'compare' : 'review';
  S.version = S.asset.versions.find(v => String(v.id) === params.get('v')) || S.asset.versions[0];
  if (!S.version) throw new Error('Màn hình chưa có phiên bản.');
  S.selected = Number(params.get('thread') || 0);
  S.status = 'all';
  S.author = '';
  S.search = '';
  await refreshThreads();
  const header = `<header class="review-header">${brand()}<a class="icon-btn" href="project.php?id=${S.project.id}" aria-label="Về dự án">${ico('back')}</a>
        <div class="review-title"><strong>${esc(S.asset.name)}</strong>
        <small>${esc(S.project.name)} · ${esc(roleName(S.project.role))}</small>
        </div>
        <div class="spacer">
        </div>${compare ? `<a class="btn" href="review.php?id=${S.asset.id}">Về nhận xét</a>` : `<select id="version-select" aria-label="Phiên bản">${S.asset.versions.map(v => `<option value="${v.id}" ${v.id === S.version.id ? 'selected' : ''}>Phiên bản ${v.version_number}</option>`).join('')}</select>
        <a class="btn" href="compare.php?id=${S.asset.id}">${ico('compare')} So sánh</a>${canManage() ? actionButton('upload-version', 'Tải bản mới') + actionButton('design-settings', 'Quản lý') : ''}`}${avatar(S.user.name, 'purple')}</header>`;
  if (compare) {
    $('#app').innerHTML = `<div class="review-app">${header}<div class="review-body compare-body">
        <main class="compare-area" id="compare-area">
        </main>
        </div>
        </div>`;
    await comparePage();
    return;
  }
  $('#app').innerHTML = `<div class="review-app">${header}<nav class="review-toolbar">${[['cursor', 'cursor', 'Chọn', 'V'], ['point', 'comment', 'Ghim điểm', 'C'], ['rectangle', 'rect', 'Khoanh vùng', 'R']].filter(x => x[0] === 'cursor' || canComment()).map(x => `<button class="tool ${S.mode === x[0] ? 'active' : ''}" data-action="mode" data-mode="${x[0]}">${ico(x[1])}<span>${x[2]}</span><kbd>${x[3]}</kbd>
        </button>`).join('')}<div class="divider">
        </div>${actionButton('zoom-out', '−')}<span class="zoom-label" id="zoom-label">Vừa ảnh</span>${actionButton('zoom-in', '+')}${actionButton('fit', 'Vừa ảnh')}${actionButton('toggle-pins', 'Ẩn/hiện ghim')}<div class="spacer">
        </div>${actionButton('refresh', 'Làm mới')}${actionButton('export-version', 'Xuất CSV')}</nav>
        <div class="review-body">
        <aside class="filmstrip">
        <div class="panel-label">Màn hình</div>${S.project.assets.map(a => `<a class="film-item ${a.id === S.asset.id ? 'current' : ''}" href="review.php?id=${a.id}">
        <img src="image.php?id=${a.latest_id}" alt=""><strong>${esc(a.name)}</strong>
        <small>${a.version_count} phiên bản</small>
        </a>`).join('')}</aside>
        <main class="canvas-column">
        <div class="canvas-status">${ico('info')} ${canComment() ? 'Chọn Ghim điểm hoặc Khoanh vùng rồi thao tác trên ảnh.' : 'Bạn có quyền chỉ xem.'}</div>
        <div class="canvas-viewport" id="viewport">
        <div class="canvas-center">
        <div class="image-stage mode-${S.mode}" id="stage">
        <img id="design-image" src="image.php?id=${S.version.id}" alt="${esc(S.asset.name)}">
        <div class="annotation-layer" id="pins">
        </div>
        <div id="draft" class="draft-region" hidden>
        </div>
        </div>
        </div>
        </div>
        <div class="canvas-caption">${S.version.width} × ${S.version.height} px · v${S.version.version_number} · ${esc(S.version.note)}</div>
        </main>
        <aside class="comments-panel">
        <div class="comments-head">
        <h3>Góp ý <span>${S.threads.length}</span>
        </h3>
        <input id="thread-search" placeholder="Tìm nội dung…" aria-label="Tìm góp ý" style="width:100%;margin-top:12px">
        <div class="comments-filters">
        <select id="thread-status" aria-label="Trạng thái"><option value="all">Mọi trạng thái</option><option value="open">Chưa xử lý</option><option value="resolved">Đã xử lý</option>
        </select>
        <select id="thread-author" aria-label="Người viết"><option value="">Mọi người</option>${S.project.members.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select>
        </div>
        </div>
        <div class="comment-list" id="comment-list">
        </div>
        <div class="hint-box">${ico('info')} Di chuột vào ghim để xem note. Bấm ghim để trao đổi và xem lịch sử.</div>
        </aside>
        </div>
        </div>`;
  paintThreads();
  fitStage();
  $('#design-image').addEventListener('load', fitStage);
  bindCanvas();
}
function fitStage() {
  const vp = $('#viewport'),
    stage = $('#stage');
  if (!vp || !stage) return;
  const fit = Math.min(1, Math.max(160, vp.clientWidth - 80) / S.version.width, Math.max(160, vp.clientHeight - 80) / S.version.height);
  const scale = S.zoom === 'fit' ? fit : S.zoom;
  stage.style.width = Math.round(S.version.width * scale) + 'px';
  $('#zoom-label').textContent = Math.round(scale * 100) + '%';
  S.actualZoom = scale;
}
function bindCanvas() {
  const stage = $('#stage');
  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('[data-action]') || !canComment() || S.mode === 'cursor') return;
    e.preventDefault();
    dragStart = PixelGeometry.point(e.clientX, e.clientY, $('#design-image').getBoundingClientRect());
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!dragStart || S.mode !== 'rectangle') return;
    const b = PixelGeometry.point(e.clientX, e.clientY, $('#design-image').getBoundingClientRect());
    const r = PixelGeometry.rectangle(dragStart, b);
    const d = $('#draft');
    d.hidden = false;
    Object.assign(d.style, {
      left: r.x * 100 + '%',
      top: r.y * 100 + '%',
      width: r.w * 100 + '%',
      height: r.h * 100 + '%'
    });
  });
  stage.addEventListener('pointerup', e => {
    if (!dragStart) return;
    const start = dragStart;
    dragStart = null;
    $('#draft').hidden = true;
    const end = PixelGeometry.point(e.clientX, e.clientY, $('#design-image').getBoundingClientRect());
    const coords = S.mode === 'rectangle' ? PixelGeometry.rectangle(start, end) : {
      ...start,
      w: 0,
      h: 0
    };
    if (S.mode === 'rectangle' && (coords.w < .001 || coords.h < .001)) {
      toast('Kéo một vùng lớn hơn để nhận xét.', true);
      return;
    }
    S.draft = {
      version_id: S.version.id,
      kind: S.mode,
      ...coords
    };
    modal('Góp ý tại vị trí đã chọn', `<form data-form="thread.create">
        <p class="coords">Ảnh gốc: x = ${Math.round(coords.x * S.version.width)}, y = ${Math.round(coords.y * S.version.height)} px</p>${textField('body', 'Nội dung góp ý')}${formEnd('Đăng góp ý')}</form>`);
    $('textarea', $('#modal')).focus();
  });
  stage.addEventListener('pointercancel', () => {
    dragStart = null;
    $('#draft').hidden = true;
  });
}

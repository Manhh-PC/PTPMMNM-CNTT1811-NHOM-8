'use strict';

const field = (name, label, value = '', type = 'text') => `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" required>
        </label>`;
const textField = (name, label, value = '') => `<label>${esc(label)}<textarea name="${name}" required maxlength="5000">${esc(value)}</textarea>
        </label>`;
const actionButton = (action, label, extra = '') => `<button type="button" class="btn small" data-action="${action}" ${extra}>${label}</button>`;
async function render() {
  const token = ++S.load;
  try {
    const {
      parts,
      params
    } = routeParts();
    if (!S.user) {
      authPage();
      return;
    }
    S.projects = await api('projects');
    if (token !== S.load) return;
    if (parts[0] === 'admin') await adminPage(params);else if (parts[0] === 'project') await projectPage(parts[1]);else if (parts[0] === 'review' || parts[0] === 'compare') await reviewPage(parts[1], params, parts[0] === 'compare');else if (parts[0] === 'help') {
      S.view = 'help';
      $('#app').innerHTML = shell(`<section class="page">
        <h1>Hướng dẫn sử dụng</h1>${helpBody()}</section>`);
    } else {
      const invitations = await api('invitations');
      dashboard();
      if (invitations.length) {
        const section = document.createElement('section');
        section.className = 'admin-note';
        section.innerHTML = '<h2>Lời mời tham gia dự án</h2>' + invitations.map(inv => `<div class="member-row">
        <div><strong>${esc(inv.name)}</strong>
        <small>${esc(inv.invited_by)} mời bạn với quyền ${esc(roleName(inv.role))}</small>
        </div>${actionButton('accept-invite', 'Chấp nhận', 'data-id="' + inv.project_id + '"')} ${actionButton('decline-invite', 'Từ chối', 'data-id="' + inv.project_id + '"')}</div>`).join('');
        document.querySelector('.page-intro').after(section);
      }
    }
  } catch (e) {
    if (e.status === 401) {
      S.user = null;
      authPage();
    } else errorView(e.message);
  }
}
function uploadDialog(version = false) {
  modal(version ? 'Tải phiên bản mới' : 'Thêm màn hình thiết kế', `<form data-form="${version ? 'version.upload' : 'asset.upload'}">${version ? '' : field('name', 'Tên màn hình')}<label>Ảnh PNG hoặc JPEG (tối đa 15 MB)<input name="image" type="file" accept="image/png,image/jpeg" required>
        </label>
        <img class="upload-preview" id="upload-preview" hidden>
        <label>Ghi chú phiên bản<textarea name="note" maxlength="1000"></textarea>
        </label>${formEnd('Tải ảnh lên')}</form>`);
}
async function membersDialog() {
  S.project = await api('project', null, {
    id: S.project.id
  });
  const roleSelect = '<label>Quyền<select name="role"><option value="reviewer">Góp ý</option><option value="viewer">Chỉ xem</option><option value="editor">Quản lý</option></select></label>';
  const members = S.project.members.map(m => {
    const attrs = 'data-id="' + m.id + '"';
    const tools = [];
    if (canManage() && m.role !== 'owner' && Number(m.id) !== Number(S.user.id)) tools.push(actionButton('remove-member', 'Gỡ', attrs));
    if (canManage() && S.project.role === 'owner' && m.role !== 'owner') tools.push(actionButton('transfer-owner', 'Giao quyền sở hữu', attrs));
    return `<div class="member-row">${avatar(m.name)}<div><strong>${esc(m.name)}</strong>
        <small>${esc(m.email)}</small>
        </div><span class="badge">${esc(roleName(m.role))}</span>${tools.join(' ')}</div>`;
  });
  if (canManage()) {
    members.push(`<h3>Mời thành viên</h3>
        <form data-form="member.invite">${field('email', 'Email đã đăng ký', '', 'email')}${roleSelect}${formEnd('Gửi lời mời')}</form>`);
    const editable = S.project.members.filter(m => m.role !== 'owner');
    if (editable.length) members.push(`<h3>Cập nhật thành viên</h3>
        <form data-form="member.save">
        <label>Thành viên<select name="email">${editable.map(m => '<option value="' + esc(m.email) + '">' + esc(m.name) + '</option>').join('')}</select>
        </label>${roleSelect}${formEnd('Cập nhật quyền')}</form>`);
  }
  modal('Thành viên dự án', members.join(''));
}
async function handleAction(el) {
  const a = el.dataset.action,
    id = Number(el.dataset.id),
    t = S.threads.find(x => Number(x.id) === id);
  if (a.startsWith('delete-')) return deleteItem(a.slice(7), id);
  if (a === 'design-settings') return designSettings();
  if (a.startsWith('admin-')) return handleAdminAction(el);
  if (a === 'close-modal') return $('#modal').close();
  if (a === 'logout') {
    await api('logout', {});
    S.user = null;
    go('/login');
    return;
  }
  if (a === 'reload') return render();
  if (a === 'help') return modal('Hướng dẫn sử dụng', helpBody());
  if (a === 'new-project') return modal('Tạo dự án mới', `<form data-form="project.create">${field('name', 'Tên dự án')}<label>Mô tả<textarea name="description" maxlength="3000"></textarea>
        </label>${field('color', 'Màu dự án', '#7255e7', 'color')}${formEnd('Tạo dự án')}</form>`);
  if (a === 'project-tab') {
    S.projectTab = el.dataset.tab;
    return projectPage(S.project.id);
  }
  if (a === 'members') return membersDialog();
  if (a === 'transfer-owner') {
    if (!confirm('Chuyển quyền sở hữu dự án cho thành viên này?')) return;
    await api('project.transfer', {
      project_id: S.project.id,
      user_id: id
    });
    return membersDialog();
  }
  if (a === 'accept-invite' || a === 'decline-invite') {
    if (a === 'decline-invite' && !confirm('Từ chối lời mời này?')) return;
    await api(a === 'accept-invite' ? 'invitation.accept' : 'invitation.decline', {
      project_id: id
    });
    return render();
  }
  if (a === 'remove-member') {
    if (!window.confirm('Gỡ thành viên này khỏi dự án?')) return;
    await api('member.remove', {
      project_id: S.project.id,
      user_id: id,
      confirmed: true
    });
    return membersDialog();
  }
  if (a === 'profile') {
    location.assign('account.php');
    return;
  }
  if (a === 'project-settings') return modal('Cài đặt dự án', `${canManage() ? `<form data-form="project.update">${field('name', 'Tên dự án', S.project.name)}<label>Mô tả<textarea name="description" maxlength="3000">${esc(S.project.description)}</textarea>
        </label>${formEnd()}</form>` : '<p>Bạn không có quyền sửa thông tin dự án này.</p>'}${S.project.role === 'owner' && (!Number(S.project.admin_locked) || S.user.system_role === 'admin') ? actionButton('delete-project', 'Xóa dự án', 'data-id="' + S.project.id + '"') : ''}${S.project.role === 'owner' && !Number(S.project.admin_locked) ? `<div style="margin-top:20px">${actionButton('archive', Number(S.project.archived) ? 'Khôi phục dự án' : 'Lưu trữ dự án')}</div>` : ''}`);
  if (a === 'archive') {
    await api('project.archive', {
      id: S.project.id,
      archived: !Number(S.project.archived)
    });
    $('#modal').close();
    return render();
  }
  if (a === 'upload-asset' || a === 'upload-version') return uploadDialog(a === 'upload-version');
  if (a === 'export-project' || a === 'export-version') {
    const params = {
      action: 'export',
      project_id: S.project.id
    };
    if (a === 'export-version') Object.assign(params, {
      version_id: S.version.id,
      status: S.status,
      author_id: S.author,
      q: S.search
    });else Object.assign(params, {
      status: $('#notes-status')?.value || 'all',
      author_id: $('#notes-author')?.value || '',
      q: $('#notes-search')?.value || ''
    });
    location.href = 'api.php?' + new URLSearchParams(params);
    return;
  }
  if (a === 'notifications') {
    const rows = await api('notifications');
    modal('Thông báo', rows.map(n => `<div class="review-result">
        <div>
        <p>${esc(n.message)}</p>
        <small>${datetime(n.created_at)}</small> <a href="${n.asset_id ? 'review.php?id=' + n.asset_id : 'project.php?id=' + n.project_id}" data-action="close-modal">Mở</a>
        </div>
        </div>`).join('') || '<p>Chưa có thông báo.</p>');
    await api('notifications.read', {});
    S.notifications = [];
    return;
  }
  if (a === 'mode') {
    S.mode = el.dataset.mode;
    $$('[data-action=mode]').forEach(x => x.classList.toggle('active', x.dataset.mode === S.mode));
    $('#stage').className = 'image-stage mode-' + S.mode;
    return;
  }
  if (['fit', 'zoom-in', 'zoom-out'].includes(a)) {
    S.zoom = a === 'fit' ? 'fit' : Math.max(.1, Math.min(3, S.actualZoom * (a === 'zoom-in' ? 1.25 : .8)));
    return fitStage();
  }
  if (a === 'toggle-pins') {
    S.showPins = !S.showPins;
    return paintThreads();
  }
  if (a === 'refresh') {
    await refreshThreads();
    paintThreads();
    toast('Đã tải góp ý mới nhất.');
    return;
  }
  if (a === 'select-thread') {
    if (S.view === 'compare') {
      const rows = await api('threads', null, {
        project_id: S.project.id
      });
      const row = rows.find(r => Number(r.id) === id);
      if (row) go(`/review/${S.asset.id}?v=${row.version_id}&thread=${id}`);
      return;
    }
    S.selected = id;
    paintThreads();
    $('#thread-' + id)?.scrollIntoView({
      block: 'nearest'
    });
    return;
  }
  if (a === 'history') {
    modal('Lịch sử góp ý #' + noteNumber(t), timeline(await api('history', null, {
      thread_id: id
    })));
    return;
  }
  if (a === 'edit-thread') return modal('Sửa góp ý #' + noteNumber(t), `<form data-form="thread.edit">
        <input type="hidden" name="id" value="${id}">
        <input type="hidden" name="revision" value="${t.revision}">${textField('body', 'Nội dung', t.body)}${formEnd()}</form>`);
  if (a === 'edit-reply') {
    const r = S.threads.flatMap(t => t.replies).find(r => Number(r.id) === id);
    return modal('Sửa trả lời', `<form data-form="reply.edit">
        <input type="hidden" name="id" value="${id}">
        <input type="hidden" name="revision" value="${r.revision}">${textField('body', 'Nội dung', r.body)}${formEnd()}</form>`);
  }
  if (a === 'thread-status') {
    await api('thread.status', {
      id,
      revision: t.revision,
      status: t.status === 'open' ? 'resolved' : 'open'
    });
    await refreshThreads();
    return paintThreads();
  }
  if (a === 'conflict-refresh') {
    const form = el.closest('form');
    const body = $('[name=body]', form).value;
    await refreshThreads();
    const current = form.dataset.form === 'thread.edit' ? S.threads.find(t => Number(t.id) === Number($('[name=id]', form).value)) : S.threads.flatMap(t => t.replies).find(t => Number(t.id) === Number($('[name=id]', form).value));
    if (current) {
      $('[name=revision]', form).value = current.revision;
      $('.error-box', form).textContent = 'Bản mới nhất: ' + current.body + ' — Bản nháp của bạn vẫn được giữ. Kiểm tra rồi bấm Lưu nếu muốn thay thế.';
      $('[name=body]', form).value = body;
    }
    return;
  }
  if (a === 'compare-side' || a === 'compare-overlay') {
    S.compareMode = a === 'compare-side' ? 'side' : 'overlay';
    return paintComparison();
  }
  if (a === 'review-result') return modal('Ghi kết quả kiểm tra', `<form data-form="review.create">
        <p>v${S.oldVersion.version_number} → v${S.newVersion.version_number}</p>
        <label>Kết quả<select name="result"><option value="approved">Đạt</option><option value="changes_requested">Cần sửa tiếp</option>
        </select>
        </label>${textField('note', 'Nhận xét sau kiểm tra')}${formEnd('Lưu kết quả')}</form>`);
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (el) handleAction(el).catch(err => toast(err.message, true));
});
document.addEventListener('submit', async e => {
  const form = e.target;
  if (!form.dataset.form) return;
  e.preventDefault();
  const action = form.dataset.form;
  const btn = $('[type=submit]', form) || $('button:last-child', form);
  const err = $('.error-box', form);
  if (err) {
    err.textContent = '';
    err.style.display = 'none';
  }
  if (btn) btn.disabled = true;
  try {
    const fd = new FormData(form);
    let d = Object.fromEntries(fd);
    if (action === 'thread.create') Object.assign(d, S.draft);
    if (action === 'project.update') d.id = S.project.id;
    if (action === 'asset.rename') d.id = S.asset.id;
    if (action === 'member.save' || action === 'member.invite') d.project_id = S.project.id;
    if (action === 'review.create') {
      if (!PixelComparison.validPair(S.oldVersion, S.newVersion)) throw new Error('Phải chọn hai phiên bản khác nhau theo thứ tự cũ → mới.');
      Object.assign(d, {
        old_version_id: S.oldVersion.id,
        new_version_id: S.newVersion.id
      });
    }
    if (action.endsWith('.upload')) {
      fd.set(action === 'asset.upload' ? 'project_id' : 'asset_id', action === 'asset.upload' ? S.project.id : S.asset.id);
      d = fd;
    }
    const result = await api(action, d);
    if (['login', 'register'].includes(action)) {
      S.user = result.user;
      S.csrf = result.csrf;
      S.notifications = await api('notifications');
      go(S.user.system_role === 'admin' ? '/admin' : '/projects');
    } else if (action === 'member.save' || action === 'member.invite') {
      await membersDialog();
      toast(action === 'member.invite' ? 'Đã gửi lời mời.' : 'Đã cập nhật quyền.');
    } else if (action === 'review.create') {
      $('#modal').close();
      await paintReviews();
      toast('Đã lưu kết quả kiểm tra.');
    } else if (action === 'project.create') {
      $('#modal').close();
      go('/project/' + result.id);
    } else if (action.endsWith('.upload')) {
      $('#modal').close();
      go(`/review/${result.asset_id}?v=${result.version_id}`);
    } else if (action.startsWith('thread.') || action.startsWith('reply.')) {
      $('#modal').close();
      if (action === 'thread.create') S.selected = result.id;
      await refreshThreads();
      paintThreads();
      toast('Đã lưu góp ý.');
    } else {
      if (action === 'profile.update') S.user = result;
      $('#modal').close();
      await render();
      toast('Đã lưu thay đổi.');
    }
  } catch (error) {
    if (err) {
      err.style.display = 'block';
      err.textContent = error.message;
      if (error.status === 409 && ['thread.edit', 'reply.edit'].includes(action)) err.insertAdjacentHTML('beforeend', '<br>' + actionButton('conflict-refresh', 'Đọc bản mới và giữ bản nháp'));
    } else toast(error.message, true);
  } finally {
    if (btn) btn.disabled = false;
  }
});
document.addEventListener('change', async e => {
  try {
    const el = e.target;
    if (el.id === 'version-select') go(`/review/${S.asset.id}?v=${el.value}`);
    if (el.id === 'thread-status' || el.id === 'thread-author') {
      S.status = $('#thread-status').value;
      S.author = $('#thread-author').value;
      paintThreads();
    }
    if (el.id === 'notes-status' || el.id === 'notes-author') renderNotesTable();
    if (el.id === 'project-sort') filterProjects();
    if (el.id === 'compare-old' || el.id === 'compare-new') {
      const old = S.asset.versions.find(v => String(v.id) === $('#compare-old').value);
      const next = S.asset.versions.find(v => String(v.id) === $('#compare-new').value);
      if (!PixelComparison.validPair(old, next)) {
        syncCompareControls();
        toast('Chọn hai phiên bản khác nhau theo thứ tự cũ → mới.', true);
        return;
      }
      S.oldVersion = old;
      S.newVersion = next;
      S.compareSplit = 50;
      await paintComparison();
    }
    if (el.name === 'image' && el.files[0]) {
      if (previewURL) URL.revokeObjectURL(previewURL);
      previewURL = URL.createObjectURL(el.files[0]);
      $('#upload-preview').src = previewURL;
      $('#upload-preview').hidden = false;
    }
  } catch (error) {
    toast(error.message, true);
  }
});
function filterProjects() {
  const q = $('#project-search').value.toLocaleLowerCase('vi');
  const archived = routeParts().params.get('archived') === '1';
  let rows = S.projects.filter(p => Boolean(Number(p.archived)) === archived && p.name.toLocaleLowerCase('vi').includes(q));
  if ($('#project-sort').value === 'name') rows.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  $('#project-grid').innerHTML = projectCards(rows, archived);
}
document.addEventListener('input', e => {
  if (e.target.id === 'thread-search') {
    S.search = e.target.value;
    paintThreads();
  }
  if (e.target.id === 'notes-search') renderNotesTable();
  if (e.target.id === 'project-search') filterProjects();
});
document.addEventListener('keydown', e => {
  if (S.view !== 'review' || e.target.closest('input,textarea,select') || $('#modal').open) return;
  const keys = {
    v: 'cursor',
    c: 'point',
    r: 'rectangle'
  };
  if (keys[e.key.toLowerCase()]) {
    const el = $(`[data-mode="${keys[e.key.toLowerCase()]}"]`);
    if (el) el.click();
  }
  if (['+', '-', '0'].includes(e.key)) {
    e.preventDefault();
    $(`[data-action="${{
      '+': 'zoom-in',
      '-': 'zoom-out',
      '0': 'fit'
    }[e.key]}"]`)?.click();
  }
});
window.addEventListener('resize', fitStage);
(async () => {
  try {
    const session = await api('session');
    S.user = session.user;
    S.csrf = session.csrf;
    if (S.user) S.notifications = await api('notifications');
    await render();
  } catch (e) {
    if (e.status === 401) {
      try {
        const fresh = await api('session');
        S.csrf = fresh.csrf;
        S.user = null;
        authPage();
      } catch (error) {
        errorView(error.message);
      }
    } else errorView(e.message);
  }
})();

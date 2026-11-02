'use strict';

function syncCompareControls() {
  const a = S.oldVersion,
    b = S.newVersion;
  for (const option of $('#compare-old').options) {
    const v = S.asset.versions.find(v => String(v.id) === option.value);
    option.disabled = !PixelComparison.validPair(v, b);
  }
  for (const option of $('#compare-new').options) {
    const v = S.asset.versions.find(v => String(v.id) === option.value);
    option.disabled = !PixelComparison.validPair(a, v);
  }
  $('#compare-old').value = String(a.id);
  $('#compare-new').value = String(b.id);
  $$('[data-action=compare-side],[data-action=compare-overlay]').forEach(el => el.classList.toggle('active', el.dataset.action === 'compare-' + S.compareMode));
}
async function comparePage() {
  const vs = [...S.asset.versions].sort((a, b) => Number(b.version_number) - Number(a.version_number));
  if (vs.length < 2) {
    $('#compare-area').innerHTML = empty('Cần ít nhất hai phiên bản', 'Tải phiên bản mới của cùng màn hình để so sánh.', canManage() ? actionButton('upload-version', 'Tải bản mới') : '');
    return;
  }
  S.oldVersion = vs[1];
  S.newVersion = vs[0];
  S.compareSplit = 50;
  $('#compare-area').innerHTML = `<div class="compare-controls">
        <label>Bản cũ<select id="compare-old">${vs.map(v => `<option value="${v.id}">v${v.version_number} · ${date(v.created_at)}</option>`).join('')}</select>
        </label>
        <label>Bản mới<select id="compare-new">${vs.map(v => `<option value="${v.id}">v${v.version_number} · ${date(v.created_at)}</option>`).join('')}</select>
        </label>${actionButton('compare-side', 'Song song')}${actionButton('compare-overlay', 'Thanh chia')}</div>
        <div id="compare-images">
        </div>
        <div class="comparison-note">Chọn hai phiên bản khác nhau. Góp ý thuộc đúng phiên bản gốc. Với thanh chia, kéo trực tiếp trên ảnh hoặc dùng thanh trượt bên dưới.</div>
        <section class="review-results">
        <div class="between">
        <h3>Kết quả kiểm tra sau sửa</h3>${canComment() ? actionButton('review-result', 'Ghi kết quả kiểm tra') : ''}</div>
        <div id="review-results">
        </div>
        </section>`;
  syncCompareControls();
  await paintComparison();
  await paintReviews();
}
async function paintComparison() {
  const a = S.oldVersion,
    b = S.newVersion,
    container = $('#compare-images');
  const request = S.compareRequest = (S.compareRequest || 0) + 1;
  if (!PixelComparison.validPair(a, b)) {
    container.innerHTML = empty('Không thể so sánh', 'Chọn bản cũ và bản mới khác nhau của cùng màn hình.');
    return;
  }
  const sameRatio = Number(a.width) * Number(b.height) === Number(b.width) * Number(a.height);
  if (S.compareMode === 'overlay' && !sameRatio) {
    S.compareMode = 'side';
    toast('Hai ảnh khác tỷ lệ: dùng song song để giữ đúng hình ảnh.');
  }
  syncCompareControls();
  if (S.compareMode === 'overlay') {
    container.innerHTML = `<div class="overlay-wrap">
        <div class="overlay-stage" id="comparison-stage" style="aspect-ratio:${Number(a.width)}/${Number(a.height)};--split:${S.compareSplit}%">
        <img class="overlay-base" src="image.php?id=${b.id}" alt="Bản mới v${b.version_number}" draggable="false">
        <div class="overlay-top">
        <img src="image.php?id=${a.id}" alt="Bản cũ v${a.version_number}" draggable="false">
        </div><span class="overlay-label old">Bản cũ · v${a.version_number}</span><span class="overlay-label new">Bản mới · v${b.version_number}</span>
        <div class="overlay-line">
        <button type="button" class="overlay-handle" role="slider" aria-label="Kéo thanh chia ảnh" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${S.compareSplit}" aria-orientation="horizontal" title="Kéo để đối chiếu; phím mũi tên để chỉnh">↔</button>
        </div>
        </div>
        <div class="overlay-range"><span>Bản mới</span>
        <input id="compare-range" aria-label="Tỷ lệ hiển thị bản cũ" type="range" min="0" max="100" step="1" value="${S.compareSplit}"><span>Bản cũ</span><output id="compare-percent">${S.compareSplit}%</output>
        </div>
        </div>`;
    PixelComparison.bindSlider($('#comparison-stage'), $('#compare-range'), S.compareSplit, value => {
      S.compareSplit = value;
      $('#compare-percent').textContent = value + '%';
    });
    return;
  }
  const rows = await api('threads', null, {
    project_id: S.project.id
  });
  // Slow requests cannot replace a newer mode or version pair.
  if (request !== S.compareRequest || S.view !== 'compare' || !container.isConnected) return;
  container.innerHTML = `<div class="compare-canvases">${[a, b].map(v => `<div class="compare-pane">
        <div class="version-label">Phiên bản ${v.version_number} · ${v.width} × ${v.height}</div>
        <div class="image-stage">
        <img src="image.php?id=${v.id}" alt="Phiên bản ${v.version_number}">
        <div class="annotation-layer">${pins(rows.filter(t => Number(t.version_id) === Number(v.id)))}</div>
        </div>
        <p class="muted" style="margin-top:12px">${esc(v.note)}</p>
        </div>`).join('')}</div>`;
}
async function paintReviews() {
  const rows = await api('reviews', null, {
    asset_id: S.asset.id
  });
  $('#review-results').innerHTML = rows.map(r => `<div class="review-result">${avatar(r.author_name)}<div><strong>${esc(r.author_name)} · v${r.old_number} → v${r.new_number} · ${r.result === 'approved' ? 'Đạt' : 'Cần sửa'}</strong>
        <p>${esc(r.note)}</p>
        <small>${datetime(r.created_at)}</small>
        </div>
        </div>`).join('') || '<p class="muted" style="margin-top:16px">Chưa có kết quả kiểm tra.</p>';
}

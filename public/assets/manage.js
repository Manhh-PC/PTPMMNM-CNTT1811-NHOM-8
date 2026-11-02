'use strict';

const deleteLabels = {
  project: 'dự án cùng toàn bộ màn hình, phiên bản và góp ý',
  asset: 'màn hình cùng tất cả phiên bản và góp ý',
  version: 'phiên bản này cùng góp ý và kết quả so sánh liên quan',
  thread: 'góp ý cùng các trả lời và lịch sử',
  reply: 'trả lời này'
};
async function deleteItem(kind, id) {
  const data = {
    id,
    confirmed: true
  };
  if (kind === 'thread' || kind === 'reply') {
    const items = kind === 'thread' ? S.threads : S.threads.flatMap(thread => thread.replies);
    data.revision = items.find(item => Number(item.id) === id).revision;
  }
  if (!window.confirm('Xóa ' + deleteLabels[kind] + '? Thao tác này không thể hoàn tác.')) return;
  await api(kind + '.delete', data);
  if ($('#modal').open) $('#modal').close();
  if (kind === 'project') go('/projects');else if (kind === 'asset') go('/project/' + S.project.id);else if (kind === 'version') go('/review/' + S.asset.id);else {
    await refreshThreads();
    if (kind === 'thread') S.selected = 0;
    paintThreads();
    toast('Đã xóa.');
  }
}
function designSettings() {
  const asset = S.asset;
  const version = S.version;
  const options = ['<form data-form="asset.rename">' + field('name', 'Tên màn hình', asset.name) + formEnd('Đổi tên') + '</form>', '<hr><p>Các thao tác dưới đây cần xác nhận trước khi xóa.</p>'];
  if (asset.versions.length > 1) options.push(actionButton('delete-version', 'Xóa phiên bản ' + version.version_number, 'data-id="' + version.id + '"'));
  options.push(actionButton('delete-asset', 'Xóa màn hình', 'data-id="' + asset.id + '"'));
  modal('Quản lý màn hình', options.join(' '));
}

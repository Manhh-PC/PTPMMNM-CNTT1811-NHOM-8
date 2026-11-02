'use strict';

// Chuyển cả liên kết cũ dạng #/review/12?v=23 sang trang PHP tương ứng.
const pageNames = ['projects', 'project', 'review', 'compare', 'admin', 'help', 'login', 'register', 'account'];
function pageUrl(route) {
  const [path, query = ''] = route.replace(/^#?\//, '').split('?');
  const [page, id] = path.split('/');
  const params = new URLSearchParams(query);
  if (id) params.set('id', id);
  const target = pageNames.includes(page) ? page : 'projects';
  return target + '.php' + (params.size ? '?' + params : '');
}
if (location.hash.startsWith('#/')) location.replace(pageUrl(location.hash));

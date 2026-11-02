'use strict';

const form = document.getElementById('account-form');
const statusLine = document.getElementById('form-status');
const submit = form.querySelector('button[type=submit]');
const action = form.dataset.endpoint;
let csrfToken = '';
async function request(action, fields) {
  const options = fields ? {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(fields)
  } : {};
  const response = await fetch('api.php?action=' + encodeURIComponent(action), options);
  const payload = await response.json();
  if (response.status === 401 && action === 'session') location.replace('login.php');
  if (!payload.ok) throw new Error(payload.error);
  return payload.data;
}
async function initialize() {
  try {
    const session = await request('session');
    csrfToken = session.csrf;
    if (!session.configured) throw new Error('Lỗi kết nối Database !!!');
    if (action === 'profile.update') {
      if (!session.user) {
        location.replace('login.php');
        return;
      }
      form.elements.name.value = session.user.name;
      form.elements.email.value = session.user.email;
    }
    submit.disabled = false;
  } catch (error) {
    statusLine.textContent = error.message;
  }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  submit.disabled = true;
  statusLine.className = '';
  statusLine.textContent = '';
  try {
    const fields = Object.fromEntries(new FormData(form));
    const result = await request(action, fields);
    if (action === 'profile.update') {
      form.elements.current_password.value = '';
      form.elements.new_password.value = '';
      form.elements.password_confirm.value = '';
      form.elements.name.value = result.name;
      form.elements.email.value = result.email;
      statusLine.className = 'success';
      statusLine.textContent = 'Đã cập nhật thông tin tài khoản.';
    } else {
      location.assign(result.user.system_role === 'admin' ? 'admin.php' : 'projects.php');
    }
  } catch (error) {
    statusLine.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});
initialize();

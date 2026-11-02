"""Admin regression suite. Requires a disposable database ending in _test, with no admin.
Run: python tests/admin_integration.py http://127.0.0.1:8088 --isolated-test-db
The web server and config.local.php must point to the SAME disposable database.
"""
import concurrent.futures
import json
import subprocess
import sys
import urllib.error
import urllib.request
import integration as suite

ROOT, TAG, Client, check = suite.ROOT, suite.TAG, suite.Client, suite.check
settings_path = ROOT / '.runtime/install.json'
settings = json.loads(settings_path.read_text(encoding='utf-8-sig')) if settings_path.exists() else {}
PHP = [settings.get('php', 'php'), *settings.get('php_args', [])]
PASSWORD = 'TestOnly123!'

def local_php(code, *args):
    return subprocess.check_output(PHP + ['-r', 'require $argv[1];' + code,
        str(ROOT / 'src/bootstrap.php'), *args], text=True)

def login(email):
    c = Client()
    result = c.call('login', dict(email=email, password=PASSWORD))
    c.csrf = result['csrf']; c.uid = result['user']['id']; c.email = email
    return c

def role_change_status(c):
    req = urllib.request.Request(suite.BASE + '/api.php?action=admin.user.role',
        data=json.dumps(dict(id=c.uid, system_role='user')).encode(),
        headers={'Content-Type':'application/json', 'X-CSRF-Token':c.csrf})
    try:
        with c.opener.open(req) as response: return response.status
    except urllib.error.HTTPError as error: return error.code

def run():
    a = Client().register('admin'); b = Client().register('second'); owner = Client().register('owner')
    anonymous = Client()
    anonymous.call('admin.summary', expected=401)
    for action in ['admin.summary', 'admin.users', 'admin.projects', 'admin.audit']:
        owner.call(action, expected=403)
    for action in ['admin.user.role', 'admin.user.status', 'admin.project.archive', 'admin.unknown']:
        owner.call(action, dict(id=owner.uid, system_role='admin', is_active=True, archived=False), 403)
    check(True, 'Anonymous and ordinary users cannot reach admin APIs')
    attacker = Client()
    result = attacker.call('register', dict(name='No privilege injection', email=TAG+'-inject@example.test',
        password=PASSWORD, password_confirm=PASSWORD, system_role='admin', is_active=0))
    attacker.csrf = result['csrf']
    check(result['user']['system_role']=='user' and int(result['user']['is_active'])==1,
          'Registration ignores injected system privileges')
    init = subprocess.run(PHP+[str(ROOT/'scripts/init-admin.php'), '--email='+a.email], capture_output=True, text=True)
    check(init.returncode==0, 'Local CLI bootstraps the first registered admin')
    repeat = subprocess.run(PHP+[str(ROOT/'scripts/init-admin.php'), '--email='+b.email], capture_output=True)
    check(repeat.returncode!=0 and b.call('session')['user']['system_role']=='user', 'Bootstrap refuses a second admin')
    check(a.call('session')['user']['system_role']=='admin', 'System role is refreshed from database')
    a.request('api.php?action=admin.user.role', b'{}', {'Content-Type':'application/json'}, 403)
    a.call('admin.user.role', expected=405)
    a.call('admin.summary', {}, 405)
    check(True, 'Admin writes require CSRF and correct HTTP method')
    a.call('admin.user.role', dict(id=a.uid, system_role='user'), 409)
    a.call('admin.user.status', dict(id=a.uid, is_active=False), 422)
    check(True, 'Last active admin and self-blocking are protected')
    a.call('admin.user.role', dict(id=b.uid, system_role='owner'), 422)
    a.call('admin.user.status', dict(id=b.uid, is_active='false'), 422)
    a.call('admin.users', expected=422, page=0)
    a.call('admin.users', expected=422, role='owner')
    a.call('admin.projects', expected=422, status='invalid')
    check(True, 'Invalid role, boolean and list filters rejected')
    local_php("for($i=0;$i<21;$i++)sql('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',"
              "['Fixture '.$i,$argv[2].'-pad'.$i.'@example.test',password_hash(bin2hex(random_bytes(16)),PASSWORD_DEFAULT)]);", TAG)
    page1 = a.call('admin.users', q=TAG); page2 = a.call('admin.users', q=TAG, page=2)
    ids1={u['id'] for u in page1['items']};ids2={u['id'] for u in page2['items']}
    check(page1['total']==25 and len(ids1)==20 and len(ids2)==5 and not ids1&ids2,
          'User search and pagination preserve all matching rows')
    check(all('password_hash' not in u and 'auth_version' not in u for u in page1['items']),
          'Admin lists never expose password hashes or session counters')
    check(a.call('admin.users', q=a.email, role='admin')['total']==1, 'Combined user filters work')
    p=owner.call('project.create', dict(name=TAG, description='Admin tests'),201)['id']
    up=owner.upload('asset.upload', dict(project_id=p, name='Admin fixture'))
    vid=up['version_id']; aid=up['asset_id']
    draft=dict(version_id=vid, body='Preserve this note', kind='point', x=.5, y=.5, w=0, h=0)
    note=owner.call('thread.create', draft,201)
    preview=a.call('project', id=p)
    a.call('asset', id=aid); a.request('image.php?id='+str(vid), raw=True)
    check(preview['role']=='owner' and preview['system_admin'], 'Nonmember admin can manage projects and protected images')
    a.call('project.update', dict(id=p,name=TAG+' revised',description='Admin managed'))
    a.call('member.save', dict(project_id=p,email=b.email,role='editor'))
    a.call('thread.edit', dict(id=note['id'],revision=1,body='Moderated'))
    a.call('thread.create', draft,201)
    version=a.upload('version.upload', dict(asset_id=aid))
    check(int(version['asset_id'])==aid, 'System admin can edit notes, members, projects and uploads without joining')
    a.call('admin.project.archive', dict(id=p,archived=True))
    owner.call('project.archive', dict(id=p,archived=False),403)
    owner.call('project.update', dict(id=p,name='Locked',description=''),409)
    owner.call('thread.create', draft,409)
    check(a.call('admin.projects',q=TAG,status='locked')['total']==1, 'Admin lock prevents owner restoration and project writes')
    a.call('admin.project.archive', dict(id=p,archived=False))
    check(owner.call('threads',project_id=p)[0]['id']==note['id'], 'Unlock preserves original project and annotations')
    owner2=login(owner.email);owner3=login(owner.email)
    a.call('admin.user.status', dict(id=owner.uid,is_active=False))
    owner.call('projects',expected=401)
    owner2.request('image.php?id='+str(vid),expected=401,raw=True)
    Client().call('login', dict(email=owner.email,password=PASSWORD),403)
    check(a.call('admin.users',q=owner.email,status='blocked')['total']==1, 'Blocked accounts lose API, image and login access')
    a.call('admin.user.status', dict(id=owner.uid,is_active=True))
    owner3.call('projects',expected=401)
    owner=login(owner.email)
    check(owner.call('project',id=p)['id']==p, 'Unblocking requires a fresh login and retains data')
    a.call('admin.user.role', dict(id=b.uid,system_role='admin'))
    b.call('admin.summary')
    a.call('admin.user.role', dict(id=b.uid,system_role='user'))
    b.call('admin.summary',expected=403)
    check(True, 'Grant and revoke take effect on existing sessions')
    audit=a.call('admin.audit')
    actions={r['action'] for r in audit['items']}
    check({'admin.bootstrap','user.role','user.status','project.lock','project.restore'}<=actions,
          'Administrative changes produce an audit trail')
    count=audit['total']
    a.call('admin.user.status',dict(id=owner.uid,is_active=True))
    check(a.call('admin.audit')['total']==count, 'No-op changes do not create misleading audit records')
    a.call('admin.user.role',dict(id=b.uid,system_role='admin'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        statuses=list(pool.map(role_change_status,[a,b]))
    check(sorted(statuses)==[200,409], 'Concurrent self-demotions preserve one active admin')
    remaining=next(c for c in [a,b] if c.call('session')['user']['system_role']=='admin')
    check(remaining.call('admin.summary')['users']['admins']==1, 'Admin invariant holds after concurrent requests')
    # Inspect the complete system-management flow using a different ordinary account.
    new_user=Client().register('admin-target')
    a=remaining
    new_email=TAG+'-changed@example.test'
    a.call('admin.user.edit',dict(id=new_user.uid,name='Edited by admin',email=new_email,new_password=PASSWORD))
    new_user.call('projects',expected=401)
    target=login(new_email)
    a.call('admin.user.delete',dict(id=target.uid),422)
    check(target.call('session')['user']['name']=='Edited by admin','Admin can edit profiles and unconfirmed account deletion is rejected')
    a.call('admin.user.delete',dict(id=target.uid,confirmed=True))
    target.call('projects',expected=401)
    check(a.call('admin.users',q=new_email)['total']==0,'Deleted identity disappears from accounts and loses access')
    local_php("sql('DELETE FROM users WHERE id=? AND deleted_at IS NOT NULL',[$argv[2]]);",str(target.uid))
    # Password changes also invalidate other sessions without logging out the current one.
    old=login(owner.email)
    owner.call('profile.update',dict(name='Updated test owner',email=owner.email,current_password=PASSWORD,new_password='ChangedTest456!',password_confirm='ChangedTest456!'))
    old.call('projects',expected=401);owner.call('projects')
    check(True,'Password change invalidates other sessions and keeps the current session')

if __name__=='__main__':
    if '--isolated-test-db' not in sys.argv:
        raise SystemExit('Refusing: supply --isolated-test-db and use a disposable database ending in _test.')
    local_php("if(!str_ends_with(config()['database'],'_test') || (int)one(\"SELECT COUNT(*) n FROM users WHERE system_role='admin'\")['n']!==0){fwrite(STDERR,'Requires disposable _test database without admins.');exit(1);}")
    try:
        run()
        print(f'ALL {len(suite.passed)} ADMIN GROUPS PASSED')
    finally:
        local_php("sql('DELETE l FROM admin_audit_log l JOIN users u ON u.id=l.actor_id WHERE u.email LIKE ?',[$argv[2].'-%@example.test']);",TAG)
        suite.cleanup()

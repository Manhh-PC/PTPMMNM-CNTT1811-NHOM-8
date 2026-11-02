"""HTTP integration tests. Creates isolated fake users/projects and cleans only their data."""
import concurrent.futures, http.cookiejar, json, pathlib, subprocess, sys, urllib.request, urllib.error, uuid
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8088'
ROOT=pathlib.Path(__file__).resolve().parents[1]
TAG='test-'+uuid.uuid4().hex[:12]
passed=[]
def check(ok,label):
    assert ok,label
    passed.append(label);print('PASS '+label)
class Client:
    def __init__(self):
        self.csrf=''
        self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.csrf=self.call('session')['csrf']
    def request(self,url,data=None,headers=None,expected=200,raw=False):
        req=urllib.request.Request(BASE+'/'+url,data=data,headers=headers or {})
        try:r=self.opener.open(req)
        except urllib.error.HTTPError as e:r=e
        body=r.read();assert r.status==expected,(r.status,expected,body.decode(errors='replace'))
        return body if raw else json.loads(body).get('data')
    def call(self,action,data=None,expected=200,**query):
        from urllib.parse import urlencode
        url='api.php?'+urlencode(dict(action=action,**query))
        return self.request(url,None if data is None else json.dumps(data).encode(),{'Content-Type':'application/json','X-CSRF-Token':self.csrf},expected)
    def register(self,role):
        self.email=TAG+'-'+role+'@example.test'
        d=self.call('register',dict(name='Test '+role,email=self.email,password='TestOnly123!',password_confirm='TestOnly123!'))
        self.csrf=d['csrf'];self.uid=d['user']['id'];return self
    def upload(self,action,fields,payload=None,expected=201):
        boundary='boundary'+uuid.uuid4().hex
        body=b''
        for k,v in fields.items():body+=f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
        body+=f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="demo.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
        body+=payload if payload is not None else (ROOT/'database/demo-images/p1-s1-v1.png').read_bytes()
        body+=f'\r\n--{boundary}--\r\n'.encode()
        return self.request('api.php?action='+action,body,{'Content-Type':'multipart/form-data; boundary='+boundary,'X-CSRF-Token':self.csrf},expected)
def run():
    a=Client().register('owner');b=Client().register('reviewer');v=Client().register('viewer');outsider=Client().register('outsider')
    check(len({a.uid,b.uid,v.uid,outsider.uid})==4,'Register four isolated accounts')
    a.request('api.php?action=project.create',b'{}',{'Content-Type':'application/json'},403)
    check(True,'CSRF missing token rejected')
    p=a.call('project.create',dict(name=TAG,description='Integration test'),201)['id']
    for user,role in [(b,'reviewer'),(v,'viewer')]:a.call('member.save',dict(project_id=p,email=user.email,role=role))
    up=a.upload('asset.upload',dict(project_id=p,name='Coordinate fixture',note='v1'));aid=up['asset_id'];vid=up['version_id']
    a.upload('asset.upload',dict(project_id=p,name='Invalid'),b'<?php echo 123;',422)
    b.upload('asset.upload',dict(project_id=p,name='Denied'),expected=403)
    check(True,'Image validation and reviewer upload permissions')
    draft=dict(version_id=vid,body='Point sample',kind='point',x=.75,y=.3,w=0,h=0)
    tid=b.call('thread.create',draft,201)['id']
    rid=b.call('thread.create',dict(draft,body='<script>alert(1)</script>',kind='rectangle',x=.2,y=.25,w=.3,h=.4),201)['id']
    b.call('thread.create',dict(draft,x=1.1),422)
    b.call('thread.create',dict(draft,kind='rectangle',x=.9,w=.2,h=.1),422)
    rows=b.call('threads',project_id=p,version_id=vid)
    check([int(t['display_number']) for t in rows]==[1,2], 'First version starts at 1 and 2 despite global IDs')
    check(tid>1, 'Global primary key remains separate from visible number')
    check(int(b.call('threads',project_id=p,version_id=vid,q='<script>')[0]['display_number'])==2, 'Filtering does not renumber a note')
    rect=next(t for t in rows if t['id']==rid)
    check([float(rect[k]) for k in ['x','y','w','h']]==[.2,.25,.3,.4] and rect['body']=='<script>alert(1)</script>','Rectangle round-trip preserves geometry and literal content')
    v.call('thread.create',draft,403);v.call('thread.edit',dict(id=tid,revision=1,body='No'),403);v.call('thread.status',dict(id=tid,revision=1,status='resolved'),403);v.call('reply.create',dict(thread_id=tid,body='No'),403)
    check(True,'Viewer cannot create/edit/reply/resolve')
    outsider.call('threads',project_id=p,expected=404);outsider.call('asset',id=aid,expected=404);outsider.request('image.php?id='+str(vid),expected=404,raw=True)
    check(True,'Nonmember cannot access private image or threads via URL')
    a.call('thread.edit',dict(id=tid,revision=1,body='Not mine'),403)
    b.call('thread.edit',dict(id=tid,revision=1,body='Updated'))
    b.call('thread.edit',dict(id=tid,revision=1,body='Stale'),409)
    check(next(t for t in b.call('threads',project_id=p) if t['id']==tid)['body']=='Updated','Stale edit returns 409 without overwriting')
    with concurrent.futures.ThreadPoolExecutor() as ex:
        results=list(ex.map(lambda pair:pair[0].call('reply.create',dict(thread_id=tid,body=pair[1]),201),[(a,'Reply A'),(b,'Reply B')]))
    row=next(t for t in a.call('threads',project_id=p) if t['id']==tid)
    check(len(row['replies'])==2 and len({r['id'] for r in results})==2,'Concurrent clients keep both replies')
    reply=next(r for r in row['replies'] if r['author_id']==b.uid)
    a.call('reply.edit',dict(id=reply['id'],revision=1,body='No'),403)
    b.call('reply.edit',dict(id=reply['id'],revision=1,body='Updated reply'))
    b.call('reply.edit',dict(id=reply['id'],revision=1,body='Stale reply'),409)
    check(True,'Reply ownership and stale revision protected')
    a.call('thread.status',dict(id=tid,revision=2,status='resolved'))
    b.call('thread.status',dict(id=tid,revision=3,status='open'))
    events=a.call('history',thread_id=tid)
    check([r['action'] for r in events]==['created','edited','resolved','reopened'],'Resolve and reopen persist full history')
    new=a.upload('version.upload',dict(asset_id=aid,note='v2 moved button'),(ROOT/'database/demo-images/p1-s1-v2.png').read_bytes())['version_id']
    check(a.call('threads',project_id=p,version_id=new)==[] and len(a.call('threads',project_id=p,version_id=vid))==2,'New version never inherits old annotations')
    fresh=b.call('thread.create',dict(draft,version_id=new,body='First new version',kind='rectangle',x=.2,y=.2,w=.3,h=.3),201)
    check(int(fresh['display_number'])==1 and int(b.call('threads',project_id=p,version_id=new)[0]['display_number'])==1, 'New version resets visible numbering to 1')
    check([int(t['display_number']) for t in a.call('threads',project_id=p,version_id=vid)]==[1,2], 'New version leaves old numbering unchanged')
    second=a.call('thread.create',dict(draft,version_id=new,body='Second new version'),201)
    check(int(second['display_number'])==2, 'Next author in new version continues with 2')
    third=a.upload('version.upload',dict(asset_id=aid,note='v3'))['version_id']
    check(int(b.call('thread.create',dict(draft,version_id=third),201)['display_number'])==1, 'Third version also starts at 1')
    b.call('review.create',dict(old_version_id=vid,new_version_id=vid,result='approved',note='Same version'),422)
    b.call('review.create',dict(old_version_id=new,new_version_id=vid,result='approved',note='Reversed'),422)
    check(True,'Server rejects equal and reversed comparison pairs')
    a.request('image.php?id='+str(vid),raw=True);a.request('image.php?id='+str(new),raw=True)
    b.call('review.create',dict(old_version_id=vid,new_version_id=new,result='approved',note='Checked'),201)
    check(len(a.call('reviews',asset_id=aid))==1,'Post-fix review recorded')
    b.call('thread.create',dict(draft,body='=1+1'),201)
    csv=a.request('api.php?action=export&project_id='+str(p),raw=True).decode('utf-8-sig')
    check("'=1+1" in csv and 'Updated' in csv,'CSV contains content and neutralizes formula injection')
    a.call('project.archive',dict(id=p,archived=True));b.call('thread.create',draft,409)
    a.call('project.archive',dict(id=p,archived=False));check(True,'Archive blocks writes and can be restored')
    with concurrent.futures.ThreadPoolExecutor() as ex:
        notes=list(ex.map(lambda user:user.call('thread.create',dict(draft,body='Concurrent numbering'),201),[a,b]))
    check(sorted(int(n['display_number']) for n in notes)==[4,5], 'Two clients receive distinct next numbers for one version')
    p2=outsider.call('project.create',dict(name=TAG+' second',description='Separate project'),201)['id']
    up2=outsider.upload('asset.upload',dict(project_id=p2,name='Other project'))
    note2=outsider.call('thread.create',dict(draft,version_id=up2['version_id']),201)
    check(int(note2['display_number'])==1, 'New project also starts at 1')
    session=b.call('logout',{});b.csrf=session['csrf'];b.call('projects',expected=401)
    check(True,'Logout ends authenticated access')
def cleanup():
    cfg=ROOT/'.runtime/install.json'
    settings=json.loads(cfg.read_text(encoding='utf-8-sig')) if cfg.exists() else {}
    subprocess.run([settings.get('php','php'),*settings.get('php_args',[]),str(ROOT/'tests/cleanup.php'),TAG],check=True)
if __name__=='__main__':
    if '--isolated-test-db' not in sys.argv:
        raise SystemExit('Use a disposable database ending in _test and pass --isolated-test-db.')
    import subprocess
    subprocess.run(['php','-r',"require $argv[1];exit(str_ends_with(config()['database'],'_test')?0:1);",str(ROOT/'src/bootstrap.php')],check=True)
    try:
        run()
        print(f'ALL {len(passed)} INTEGRATION GROUPS PASSED')
    finally:cleanup()

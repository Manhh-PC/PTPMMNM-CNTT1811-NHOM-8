"""Kiểm tra luồng bàn giao trên một database thử nghiệm riêng."""
import csv
import io
import re
import subprocess
import sys
from html.parser import HTMLParser
import integration as suite
from integration import Client, ROOT, TAG, check, cleanup

class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.files=[]
    def handle_starttag(self, tag, attributes):
        a=dict(attributes)
        if tag=='script' and a.get('src'): self.files.append(a['src'])
        if tag=='link' and a.get('href'): self.files.append(a['href'])

def run():
    owner=Client().register('owner')
    reviewer=Client().register('reviewer')
    guest=Client().register('guest')
    for page in ['index','login','register','account','projects','project','review','compare','admin','help']:
        html=owner.request(page+'.php',raw=True).decode()
        assert '<html lang="vi">' in html
        parser=Assets();parser.feed(html)
        for path in parser.files: assert owner.request(path,raw=True)
    check(True,'All ten PHP pages and their local scripts and styles respond')

    old_email=owner.email
    new_email=TAG+'-updated@example.test'
    profile=dict(name='Hồ sơ mới',email=new_email,current_password='TestOnly123!',new_password='',password_confirm='')
    owner.call('profile.update',dict(profile,current_password='incorrect'),422)
    owner.call('profile.update',dict(profile,email=reviewer.email),409)
    owner.call('profile.update',dict(profile,new_password='ValidPass456',password_confirm='different'),422)
    updated=owner.call('profile.update',profile)
    assert updated['name']==profile['name'] and updated['email']==new_email
    Client().call('login',dict(email=old_email,password='TestOnly123!'),401)
    Client().call('login',dict(email=new_email,password='TestOnly123!'))
    check(True,'Name and email update atomically with password verification and uniqueness checks')

    project=owner.call('project.create',dict(name=TAG,description='Regression'),201)['id']
    owner.call('member.invite',dict(project_id=project,email=reviewer.email,role='reviewer'))
    reviewer.call('project',expected=404,id=project)
    guest.call('invitation.accept',dict(project_id=project),404)
    assert reviewer.call('invitations')[0]['project_id']==project
    reviewer.call('invitation.accept',dict(project_id=project))
    check(reviewer.call('project',id=project)['role']=='reviewer','Only the recipient can accept an invitation')
    owner.call('member.invite',dict(project_id=project,email=guest.email,role='viewer'))
    guest.call('invitation.decline',dict(project_id=project))
    check(guest.call('invitations')==[],'Declining an invitation grants no membership')

    asset=owner.upload('asset.upload',dict(project_id=project,name='Áp phích'))
    aid=asset['asset_id'];v1=asset['version_id']
    v2=owner.upload('version.upload',dict(asset_id=aid))['version_id']
    def note(version,body):
        return reviewer.call('thread.create',dict(version_id=version,body=body,x=.75,y=.3,kind='point'),201)
    notes=[note(v1,word) for word in ['đầu tiên','ở giữa','sau cùng']]
    more=[note(v2,'mới'),note(v2,'mới nữa')]
    check([t['display_number'] for t in notes]==[1,2,3] and [t['display_number'] for t in more]==[1,2],'V1 shows 1,2,3 and V2 independently shows 1,2')
    n=notes[1]
    for flag in [{},{'confirmed':False},{'confirmed':'true'}]:
        owner.call('thread.delete',dict(flag,id=n['id'],revision=1),422)
    assert len(owner.call('threads',project_id=project,version_id=v1))==3
    owner.call('thread.delete',dict(id=n['id'],revision=42,confirmed=True),409)
    owner.call('thread.delete',dict(id=n['id'],revision=1,confirmed=True))
    assert note(v1,'tiếp theo')['display_number']==4
    rows=reviewer.call('threads',project_id=project,version_id=v1,q='sau cùng')
    assert [r['display_number'] for r in rows]==[3]
    response=owner.request(f'api.php?action=export&project_id={project}&version_id={v1}',raw=True).decode('utf-8-sig')
    assert [r[0] for r in list(csv.reader(io.StringIO(response)))[1:]]==['1','3','4']
    check(True,'Deletion, filtering and CSV retain stable per-version numbers')
    r=reviewer.call('reply.create',dict(thread_id=notes[0]['id'],body='Trả lời'),201)
    reviewer.call('reply.delete',dict(id=r['id'],revision=1),422)
    guest.call('reply.delete',dict(id=r['id'],revision=1,confirmed=True),404)
    reviewer.call('reply.delete',dict(id=r['id'],revision=1,confirmed=True))
    check(True,'Reply deletion requires confirmation, access and current revision')
    for action,id in [('project.delete',project),('asset.delete',aid),('version.delete',v1)]:
        owner.call(action,dict(id=id),422)
        reviewer.call(action,dict(id=id,confirmed=True),403)
    reviewer.call('review.create',dict(old_version_id=v1,new_version_id=v2,result='approved',note='Duyệt'),201)
    owner.call('version.delete',dict(id=v1,confirmed=True))
    owner.request('image.php?id='+str(v1),expected=404,raw=True)
    assert owner.call('reviews',asset_id=aid)==[]
    owner.call('version.delete',dict(id=v2,confirmed=True),422)
    assert owner.call('threads',project_id=project,version_id=v2)[0]['display_number']==1
    owner.call('asset.delete',dict(id=aid,confirmed=True))
    check(True,'Confirmed version/asset deletes remove private images and dependent reviews')
    owner.call('member.remove',dict(project_id=project,user_id=reviewer.uid),422)
    owner.call('project.transfer',dict(project_id=project,user_id=reviewer.uid))
    owner.call('project.delete',dict(id=project,confirmed=True),403)
    reviewer.call('member.remove',dict(project_id=project,user_id=owner.uid,confirmed=True))
    owner.call('project',expected=404,id=project)
    reviewer.call('project.delete',dict(id=project,confirmed=True))
    reviewer.call('project',expected=404,id=project)
    check(True,'Ownership transfer, confirmed member removal and confirmed project deletion work')

if __name__=='__main__':
    if '--isolated-test-db' not in sys.argv: raise SystemExit('Pass --isolated-test-db.')
    subprocess.run(['php','-r',"require $argv[1];exit(str_ends_with(config()['database'],'_test')?0:1);",str(ROOT/'src/bootstrap.php')],check=True)
    try:
        run()
        print(f'ALL {len(suite.passed)} DELIVERY GROUPS PASSED')
    finally: cleanup()


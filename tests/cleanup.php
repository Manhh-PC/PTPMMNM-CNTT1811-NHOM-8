<?php
if(PHP_SAPI!=='cli') exit;
require __DIR__.'/../src/bootstrap.php';
if(!str_ends_with(config()['database'],'_test')) { fwrite(STDERR,'Requires a disposable _test database.');exit(1); }
$tag=$argv[1]??'';
if(!preg_match('/^test-[a-f0-9]{12}$/',$tag)) exit(1);
// Only accounts and projects with this run's random test marker are eligible.
$users=all('SELECT id FROM users WHERE email LIKE ?',[$tag.'-%@example.test']);
$files=all('SELECT v.filename FROM versions v JOIN assets a ON a.id=v.asset_id JOIN projects p ON p.id=a.project_id JOIN users u ON u.id=p.owner_id WHERE u.email LIKE ?',[$tag.'-%@example.test']);
db()->beginTransaction();
foreach($users as $u)sql('DELETE FROM projects WHERE owner_id=?',[$u['id']]);
foreach($users as $u)sql('DELETE FROM users WHERE id=?',[$u['id']]);
db()->commit();
foreach($files as $f)if(preg_match('/^[a-f0-9]{48}\.(png|jpg)$/',$f['filename']))unlink(ROOT.'/storage/uploads/'.$f['filename']);
echo "Cleaned isolated test fixtures.\n";

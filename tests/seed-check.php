<?php
if(PHP_SAPI!=='cli')exit;
require __DIR__.'/../src/bootstrap.php';
$expected=['users'=>3,'projects'=>2,'assets'=>6,'versions'=>12,'threads'=>20];
foreach($expected as $table=>$count){$actual=(int)one('SELECT COUNT(*) n FROM '.$table)['n'];if($actual!==$count)throw new RuntimeException("$table: expected $count, got $actual (requires unchanged demo database)");echo "PASS seed $table = $count\n";}
$t=one('SELECT t.x,t.y,v.width,v.height FROM threads t JOIN versions v ON v.id=t.version_id WHERE t.id=1');
if((float)$t['x']!==.75||(float)$t['y']!==.3||(int)$t['width']!==1000||(int)$t['height']!==500)throw new RuntimeException('Sample point mismatch');
echo "PASS sample point (750,150) on 1000x500\n";

<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
if(in_array('--baseline',$argv,true)){
    echo json_encode(['version_id'=>PHP_VERSION_ID,'os'=>PHP_OS_FAMILY,'extensions'=>get_loaded_extensions()]);exit;
}
$errors=[];
if(PHP_VERSION_ID<80200)$errors[]='Can PHP 8.2 tro len.';
foreach(['pdo_mysql','mbstring','fileinfo'] as $ext)if(!extension_loaded($ext))$errors[]='Thieu PHP extension: '.$ext;
if(!class_exists('PDO')||!in_array('mysql',PDO::getAvailableDrivers(),true))$errors[]='Thieu PDO MySQL driver.';
if($errors){fwrite(STDERR,implode(PHP_EOL,$errors).PHP_EOL);exit(1);}
echo 'PHP '.PHP_VERSION.': pdo_mysql, mbstring, fileinfo OK.'.PHP_EOL;

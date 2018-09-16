<?php

define("OUT_DIR", __DIR__."/output/");

$file_name = $_GET['file'];
$file_path = OUT_DIR . $file_name;

header('Content-type:  application/tar');
header('Content-Length: ' . filesize($file_path));
header('Content-Disposition: attachment; filename="'.$file_name.'"');
readfile($file_path);


<?php

if (!isset($_POST['item']) || !is_array($_POST['item'])) {
    ReturnJSON(false, "No parts selected for creating package!");
}

define("TEMP_DIR", __DIR__."/temp/");
define("OUT_DIR", __DIR__."/output/");
define("LESS_DIR", __DIR__."/source/less/");
define("JS_DIR", __DIR__."/source/js/");
define("ICONS_DIR", __DIR__."/source/icons/");

function ReturnJSON($result = true, $message = "OK", $data = array()){
    header('Content-Type: text/json; charset=UTF-8');
    echo json_encode(array("result"=>$result, "message"=>$message, "data"=>$data));
    exit(0);
}

$data = $_POST['item'];
$custom_less = isset($_POST['custom_less']) ? "\n\n".$_POST['custom_less'] : "";
$custom_js = isset($_POST['custom_js']) ? "\n\n".$_POST['custom_js'] : "";
$minified = isset($_POST['minified']);
$source_map = $minified && isset($_POST['source_map']);

$package = json_decode(file_get_contents("package.json"), true);
$config = json_decode(file_get_contents("config.json"), true);

$ver_number = $package['version'];
$ver_build = $package['build'];
$ver_status = "";

$hash = "metro4-$ver_number-".md5(implode("", $data) . ($minified ? "minified" : "") . ($minified && $source_map ? "source_map":""));

$archive = OUT_DIR . $hash . ".zip";
$archive_link = "getmetro.php?file=" . $hash.".zip";

if (file_exists($archive)) {
    ReturnJSON(true, "CACHE", ['href'=>$archive_link]);
    exit(0);
}

$copy = <<<COPYRIGHT
/*
 * Metro 4 Components Library v{$ver_number} build {$ver_build} (https://metroui.org.ua)
 * Copyright 2018 Sergey Pimenov
 * Licensed under MIT
 */
 
COPYRIGHT;

$js_head = <<<JS_HEAD
(function( factory ) {
    if ( typeof define === 'function' && define.amd ) {
        define([ 'jquery' ], factory );
    } else {
        factory( jQuery );
    }
}(function( jQuery ) {

'use strict';

var $ = jQuery;


JS_HEAD;

$js_foot = <<<JS_FOOT


return METRO_INIT === true ? Metro.init() : Metro;
}));
JS_FOOT;


$output = $exit_status = NULL;

$less_path = "./node_modules/less/bin/lessc";
$uglify_path = "./node_modules/uglify-js/bin/uglifyjs";
$less_command = $less_path . ($minified ? " --clean-css " : " ") . "LESS_FILE CSS_FILE 2>&1";
$uglify_command = $uglify_path ." JS_FILE --output JS_MIN ". ($minified ? " --compress ":" ").($source_map ? " --source-map " : " ") . " 2>&1";

$request = [
    "css" => [],
    "js" => [],
    "comp" => [],
];

foreach ($data as $val) {
    if (strpos($val, "_css") !== false) {
        $request['css'][] = $val;
    }
    if (strpos($val, "_js") !== false) {
        $request['js'][] = $val;
    }
    if (strpos($val, "_comp") !== false) {
        $request['comp'][] = $val;
    }
}

$less = [];
$js = [];

$required = [
    "utils/utilities.js"
];


if (count($request['css']) > 0) {
    foreach ($request['css'] as $val) {
        $files = $config['css']['base'][$val]['less'];
        foreach ($files as $file) {
            $f = $file . ".less";
            if (!in_array($f, $less)) array_push($less, $f);
        }
    }
}

if (count($request['js']) > 0) {
    foreach ($request['js'] as $val) {
        $files = $config['js']['utils'][$val]['js'];
        $dependencies = isset($config['js']['utils'][$val]['dependencies']) ? $config['js']['utils'][$val]['dependencies'] : [];
        foreach ($files as $file) {
            $f = $file.".js";
            if (!in_array($f, $js)) array_push($js, $f);
        }

        if (count($dependencies) > 0) {

            $js_files = isset($dependencies['js']) ? $dependencies['js'] : [];

            foreach ($js_files as $file) {
                $f = $file . ".js";
                if (!in_array($f, $js)) array_push($js, $f);
            }
        }
    }
}

if (count($request['comp']) > 0) {

    foreach ($request['comp'] as $val) {
        $less_files = isset($config['js']['components'][$val]['less']) ? $config['js']['components'][$val]['less'] : [];
        $js_files = isset($config['js']['components'][$val]['js']) ? $config['js']['components'][$val]['js'] : [];
        $dependencies = isset($config['js']['components'][$val]['dependencies']) ? $config['js']['components'][$val]['dependencies'] : [];

        foreach ($less_files as $file) {
            $f = $file . ".less";
            if (!in_array($f, $less)) array_push($less, $f);
        }

        foreach ($js_files as $file) {
            $f = $file . ".js";
            if (!in_array($f, $js)) array_push($js, $f);
        }

        if (count($dependencies) > 0) {

            $less_files = isset($dependencies['less']) ? $dependencies['less'] : [];
            $js_files = isset($dependencies['js']) ? $dependencies['js'] : [];

            foreach ($less_files as $file) {
                $f = $file . ".less";
                if (!in_array($f, $less)) array_push($less, $f);
            }

            foreach ($js_files as $file) {
                $f = $file . ".js";
                if (!in_array($f, $js)) array_push($js, $f);
            }
        }
    }
}

$file_id = uniqid();

$less_replace_array = [
    '@import (once) "vars";',
    '@import (once) "include/vars";',
    '@import (once) "../include/vars";',
    '@import (once) "mixins";',
    '@import (once) "include/mixins";',
    '@import (once) "../include/mixins";',
    '@import (once) "include/default-icons";',
    '@import (once) "default-icons";'
];

$less_complete_file_content = "";
$less_complete_file_name = "metro-{$ver_number}-{$ver_build}-".$file_id.".less";
$css_complete_file_name = "metro-{$ver_number}-{$ver_build}-".$file_id.($minified ? ".min":"").".css";

$js_complete_file_content = "";
$js_complete_file_name = "metro-{$ver_number}-{$ver_build}-".$file_id.".js";
$js_complete_file_name_min = "metro-{$ver_number}-{$ver_build}-".$file_id.".min.js";

if (count($less) > 0) {

    array_unshift($less, "include/default-icons.less");
    array_unshift($less, "include/mixins.less");
    array_unshift($less, "include/vars.less");

    $less_complete_file_content = file_get_contents("source/less/reset.less");

    foreach ($less as $file) {
        if ($file === "include/default-icons") {
            $file_content =  str_replace("less/", LESS_DIR, file_get_contents("source/less/".$file)) . "\n\n";
        } else {
            $file_content = file_get_contents("source/less/".$file) . "\n\n";
        }
        $less_complete_file_content .= $file_content;
    }

    $less_complete_file_content = str_replace($less_replace_array, "", $less_complete_file_content);
    $less_complete_file_content = str_replace("'less/", "'".LESS_DIR, $less_complete_file_content);

    $less_complete_file_content .= $custom_less;
}

if (count($js) > 0) {

    if (!in_array("utils/utilities.js", $js)) array_unshift($js, "utils/utilities.js");

    $js_complete_file_content .= $copy;
    $js_complete_file_content .= $js_head;

    $js_complete_file_content .= str_replace(['@@version', '@@build', '@@status'], [$ver_number, $ver_build, $ver_status], file_get_contents("source/js/metro.js")) . "\n\n";

    foreach ($js as $file) {
        $js_complete_file_content .= file_get_contents("source/js/".$file) . "\n\n";
    }

    $js_complete_file_content .= $js_foot;
    $js_complete_file_content .= $custom_js;
}

$less_temp_file = TEMP_DIR . $less_complete_file_name;
$css_temp_file = TEMP_DIR . $css_complete_file_name;
$js_temp_file = TEMP_DIR . $js_complete_file_name;
$js_temp_file_min = TEMP_DIR . $js_complete_file_name_min;

if ($less_complete_file_content !== "" && !file_exists($less_temp_file)) {
    $fp = fopen($less_temp_file, "w");
    fwrite($fp, $less_complete_file_content);
    fclose($fp);
}

if ($js_complete_file_content !== "" && !file_exists($js_temp_file)) {
    $fp = fopen($js_temp_file, "w");
    fwrite($fp, $js_complete_file_content);
    fclose($fp);
}

try {
    if (substr(php_uname(), 0, 7) == "Windows"){
        $less_command = "node " . str_replace(['LESS_FILE', 'CSS_FILE'], [$less_temp_file, $css_temp_file], $less_command);
        $handle = popen($less_command, 'r');
        $read = fread($handle, 2096);
        pclose($handle);

        if ($minified) {
            $uglify_command = "node " . str_replace(['JS_FILE', 'JS_MIN'], [$js_temp_file, $js_temp_file_min], $uglify_command);
            $handle = popen($uglify_command, 'r');
            $read = fread($handle, 2096);
            pclose($handle);
        }
    } else {
        $less_command = str_replace(['LESS_FILE', 'CSS_FILE'], [$less_temp_file, $css_temp_file], $less_command);
        exec($less_command, $output, $exit_status);
        $was_successful = ($exit_status == 0) ? TRUE : FALSE;

        if ($minified) {
            $uglify_command = str_replace(['JS_FILE', 'JS_MIN'], [$js_temp_file, $js_temp_file_min], $uglify_command);
            exec($uglify_command, $output, $exit_status);
            $was_successful = ($exit_status == 0) ? TRUE : FALSE;
        }
    }

    $zip = new ZipArchive();
    if ($zip->open($archive, ZipArchive::CREATE) !== true) {
        throw new Exception("Unable to create archive file!");
    }
    if (file_exists($css_temp_file)) $zip->addFile($css_temp_file, pathinfo($css_temp_file, PATHINFO_BASENAME));
    $js_file = $minified ? $js_temp_file_min : $js_temp_file;
    if (file_exists($js_file)) $zip->addFile($js_file, pathinfo($js_file, PATHINFO_BASENAME));
    if ($source_map) {
        if (file_exists($js_file.".map")) $zip->addFile($js_file.".map", pathinfo($js_file.".map", PATHINFO_BASENAME));
    }
    $zip->close();

    @unlink($less_temp_file);
    @unlink($css_temp_file);
    @unlink($js_temp_file);
    @unlink($js_temp_file_min);
    @unlink($js_temp_file_min.".map");

    ReturnJSON(true, "OK", ['href'=>$archive_link]);

} catch (Exception $e) {
    @unlink($less_temp_file);
    @unlink($css_temp_file);
    @unlink($js_temp_file);
    @unlink($js_temp_file_min);

    ReturnJSON(false, $e->getMessage());
}


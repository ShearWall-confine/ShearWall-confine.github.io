<?php
$serverName = "DESKTOP-T3CRJCR";
$connectionOptions = array(
    "Database" => "shearwall",
    "Uid" => "Administrator",
    "PWD" => ""
);
$conn = sqlsrv_connect($serverName, $connectionOptions);
if ($conn === false) {
    die(print_r(sqlsrv_errors(), true));
}
?>
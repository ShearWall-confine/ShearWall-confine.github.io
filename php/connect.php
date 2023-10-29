<!DOCTYPE html>
<html>
<head>
    <title>CSV 数据</title>
</head>
<body>

<?php
$csvFile = '20231029.csv'; // CSV 文件的路径

// 从 CSV 文件中读取数据
$file = fopen($csvFile, 'r');
$headers = fgetcsv($file);

// 逐行生成页面
while (($row = fgetcsv($file)) !== false) {
    // 开始生成单独的页面
    echo '<div>';
    echo '<h2>' . $headers[0] . ': ' . $row[0] . '</h2>'; // 第一列的表头和值
    echo '<table>';
    
    // 生成表头
    echo '<thead>';
    echo '<tr>';
    foreach ($headers as $header) {
        echo '<th>' . $header . '</th>';
    }
    echo '</tr>';
    echo '</thead>';
    
    // 生成行数据
    echo '<tbody>';
    echo '<tr>';
    foreach ($row as $value) {
        echo '<td>' . $value . '</td>';
    }
    echo '</tr>';
    echo '</tbody>';
    
    echo '</table>';
    echo '</div>';
}

fclose($file);
?>

</body>
</html>
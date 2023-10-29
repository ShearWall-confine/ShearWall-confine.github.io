<?php
$sql = "SELECT * FROM users";
$stmt = sqlsrv_query($conn, $sql);
if ($stmt === false) {
    die(print_r(sqlsrv_errors(), true));
}
while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    echo "Name: " . $row['name'] . "<br>";
    echo "Email: " . $row['email'] . "<br>";
    echo "Age: " . $row['age'] . "<br>";
    echo "<br>";
}
sqlsrv_free_stmt($stmt);
?>
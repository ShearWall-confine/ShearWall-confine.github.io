$(document).ready(function() {
    // 读取CSV文件
    $.ajax({
        url: '20231029.csv',
        dataType: 'text',
        success: function(data) {
            var lines = data.split('\n');
            var table1 = document.getElementById('table1');

            for (var i = 1; i < lines.length; i++) {
                var cells = lines[i].split(',');
                var row = table1.insertRow();
                var cell1 = row.insertCell();
                cell1.innerHTML = cells[0];
                var cell2 = row.insertCell();
                cell2.innerHTML = cells[1];

                // 添加点击事件
                row.addEventListener('click', function() {
                    var cellData = this.cells[0].innerHTML;
                    window.location.href = 'base_list.html?data=' + encodeURIComponent(cellData);
                });
            }
        }
    });
});

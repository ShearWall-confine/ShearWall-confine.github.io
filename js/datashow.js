$(document).ready(function() {
    // 获取URL参数
    var urlParams = new URLSearchParams(window.location.search);
    var cellData = urlParams.get('data');
    // 读取CSV文件
    $.ajax({
        url: '20231029.csv',
        dataType: 'text',
        success: function(data) {
            var lines = data.split('\n');
            var firstRow = lines[0].split(',');
            var table2 = document.getElementById('table2');
            var table3 = document.getElementById('table3');
            for (var i = 0; i < firstRow.length; i++) 
            {
                var row2 = table2.insertRow();
                var cell = row2.insertCell();
                cell.innerHTML = firstRow[i];
            }
            for (var j = 0; j < lines.length; j++) 
            {
                var cells = lines[j].split(',');
                if (cells[0] === cellData) 
                {
                    for (var k = 0; k < cells.length; k++) 
                    {
                        var cell2 = table2.rows[k].insertCell();
                        cell2.innerHTML = cells[k];
                    }
                }
            }
        }
    });
});
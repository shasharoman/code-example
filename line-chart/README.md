line-chart
==========

供小程序内使用的简单折线图，使用步骤：

-   clone或者复制js代码到自己项目中
-   在需要绘图的页面里放置一个canvas并指定id
-   在页面对应的js中onReady时初始化并绘制折线图

更多内容请参考[此文](https://amsimple.com/blog/article/84.html)。

code example:

``` {.javascript}
const lineChart = require('./lineChart.js');

// demo是页面上已存在canvas的id
let chart = lineChart.init('demo', {
    width: 320,
    height: 200,
    margin: 10,
    xAxis: ['10.1', '10.2', '10.3', '10.4', '10.5', '10.6', '10.7']
    lines: [{
        color: '#1296db',
        points: [100, 123, 182, 102, 88, 90, 70]
    }]
});
chart.draw();
```

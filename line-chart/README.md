line-chart
==========

供小程序内使用的简单折线图，使用步骤：

-   clone或者复制js代码到自己项目中
-   在需要绘图的页面里放置一个canvas并指定id
-   在页面对应的js中onReady时初始化并绘制折线图

更多内容请参考[此文](https://amsimple.com/blog/article/84.html)。

code example:
-------------

### wxml

``` {.html}
<view class="wrap" style="width: 320px; height: 200px;">
    <canvas canvas-id="chart" style="width: 320px; height: 200px;"></canvas>

    <!-- 用于触摸提示，保持与上一个canvas大小与位置完全一致，不需要的话可以省略 -->
    <canvas canvas-id="chart-tips" style="width: 320px; height: 200px;"
        disable-scroll
        bindtouchstart="tipsStart"
        bindtouchmove="tipsMove"
        bindtouchend="tipsEnd">
    </canvas>
</view>
```

### css

``` {.css}
.wrap {
    position: relative;
    margin: 0 auto;
}

.wrap canvas {
    position: absolute;
    top: 0;
    left: 0;
}
```

### js

``` {.javascript}
const lineChart = require('./line-chart/index.js');
let chart = null;

Page({
    onReady: function() {
        chart = lineChart.init('chart', {
            tipsCtx: 'chart-tips',
            width: 320,
            height: 200,
            margin: 10,
            yUnit: 'h'
            xAxis: ['10.1', '10.2', '10.3', '10.4', '10.5', '10.6', '10.7']
            lines: [{
                color: '#1296db',
                points: [5, 6, 8, 6, 7, 4, 3]
            }]
        });
        chart.draw();
    },

    tipsStart: function(e) {
        let x = e.changedTouches[0].x;

        this.chartTipsShowing = true;
        chart.tipsByX(x);
    },

    tipsMove: function(e) {
        let x = e.changedTouches[0].x;

        if (this.chartTipsShowing) {
            chart.tipsByX(x);
        }
    },

    tipsEnd: function() {
        this.chartTipsShowing = false;
        chart.clearTips();
    }
});
```

const _ = require('./lodash.js');

exports.init = function (ctx, options) {
    return new LineChart(ctx, options);
};

function LineChart(ctx, options) {
    if (_.isString(ctx)) {
        ctx = wx.createCanvasContext(ctx);
    }

    this.ctx = ctx;
    this.options = Object.assign({
        width: 320,
        height: 200,
        labelColor: '#888888',
        axisColor: '#d0d0d0',
        xUnit: '',
        yUnit: '',
        xAxis: [],
        lines: [],
        margin: 20,
        fontSize: 12,
    }, options, {
        xAxisOffset: (options.margin || 20) + (options.fontSize || 12) * 1.5
    });

    this._attrs = {};

    if (_.isEmpty(this.options.xAxis)) {
        throw new Error('options.xAxis can not be empty');
    }
}

LineChart.prototype.draw = function () {
    this._clear();

    this._drawAxis();
    this._drawLines();

    this._draw();
};

LineChart.prototype.hideLine = function (index) {
    let {
        lines
    } = this.options;

    if (lines[index]) {
        lines[index].hidden = true;
        this.draw();
    }
};

LineChart.prototype.showLine = function (index) {
    let {
        lines
    } = this.options;

    if (lines[index] && lines[index].hidden) {
        lines[index].hidden = false;
        this.draw();
    }
};

LineChart.prototype._clear = function () {
    let {
        width,
        height
    } = this.options;

    this.ctx.clearRect(0, 0, width, height);
};

LineChart.prototype._drawAxis = function () {
    let {
        width,
        height,
        lines,
        labelColor,
        axisColor,
        xUnit,
        yUnit,
        xAxis,
        margin,
        xAxisOffset,
        fontSize
    } = this.options;
    let ctx = this.ctx;

    ctx.setFontSize(fontSize);

    let yAxisLen = height - margin - xAxisOffset;
    let yLabelCount = Math.floor(yAxisLen / 25);
    let yMaxValue = _.max(_.map(lines, item => _.max(item.points))) || 1;

    // 计算需要绘制的y轴label
    let fixed = 0;
    let yDelta = yMaxValue * 1.2 / yLabelCount;
    if (yDelta < 1) {
        fixed = Math.round(1 / yDelta).toString().length;
    }
    yDelta = Number(fixed === 0 ? Math.ceil(yDelta) : yDelta.toFixed(fixed));
    let labels = [];
    for (let i = 2; i <= yLabelCount; i++) {
        labels.push(Number(((i - 1) * yDelta).toFixed(fixed)) + yUnit);
    }

    let xLabelMaxWidth = _.max(_.map(xAxis, item => ctx.measureText(item + xUnit).width));
    let yLabelMaxWidth = _.max(_.map(labels, item => ctx.measureText(item).width)) + margin;
    let xAxisLen = width - margin - yLabelMaxWidth;

    let xOffset = yLabelMaxWidth;
    let xStep = xAxisLen / (xAxis.length - 1);
    let yOffset = margin + yAxisLen;
    let yStep = yAxisLen / (yMaxValue * 1.2);

    // 绘制x轴
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = axisColor;
    ctx.moveTo(yLabelMaxWidth, height - xAxisOffset);
    ctx.lineTo(width - margin, height - xAxisOffset);
    ctx.stroke();

    // 绘制x轴label
    let xLabelCount = Math.floor(xAxisLen / xLabelMaxWidth);
    let xLabelStep = Math.ceil(xAxis.length / xLabelCount);
    // 需要被绘制的lable
    let xLabel = _.filter(_.map(xAxis, (item, index) => ({
        name: item + xUnit,
        index: index
    })), (item, index) => index % xLabelStep === 0);
    _.each(xLabel, item => {
        let xValue = xOffset + item.index * xStep - xLabelMaxWidth / 2 - 2;
        ctx.fillStyle = labelColor;
        ctx.fillText(item.name, xValue, height - margin);
    });

    // 绘制y轴label，以及水平标记线
    _.each(labels, (item, index) => {
        let xValue = (yLabelMaxWidth - ctx.measureText(item).width) - 5;
        let yValue = yOffset - yStep * Number((index + 1) * yDelta).toFixed(fixed);

        // 水平标记线
        ctx.beginPath();
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = axisColor;
        ctx.moveTo(yLabelMaxWidth, yValue);
        ctx.lineTo(width - margin, yValue);
        ctx.stroke();

        // label
        ctx.strokeStyle = labelColor;
        ctx.fillText(item, xValue, yValue + 4);
    });

    // 将这几个数据存放在attrs上，绘制线的时候有用
    Object.assign(this._attrs, {
        xOffset,
        yOffset,
        xStep,
        yStep
    });
};

LineChart.prototype._drawLines = function () {
    _.each(this.options.lines, item => {
        if (item.hidden) {
            return;
        }

        this._drawLine(item);
    });
};

LineChart.prototype._drawLine = function (line) {
    let {
        xOffset,
        yOffset,
        xStep,
        yStep
    } = this._attrs;
    let ctx = this.ctx;

    let points = _.map(line.points, (item, index) => ({
        x: xOffset + index * xStep,
        y: yOffset - item * yStep
    }));

    // 与x轴的面积阴影
    ctx.beginPath();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = line.color;
    ctx.moveTo(xOffset, yOffset);
    _.each(points, item => {
        ctx.lineTo(item.x, item.y);
    });
    ctx.lineTo(xOffset + xStep * (points.length - 1), yOffset);
    ctx.closePath();
    ctx.fill();

    // 线
    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.strokeStyle = line.color;
    _.each(points, item => {
        ctx.lineTo(item.x, item.y);
    });
    ctx.stroke();

    // 空心点
    _.each(points, item => {
        ctx.beginPath();
        ctx.arc(item.x, item.y, 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();
    });
};

LineChart.prototype._draw = function () {
    if (this._timer) {
        clearTimeout(this._timer);
    }

    this._timer = setTimeout(() => {
        this.ctx.draw();
    });
};

const _ = require('./lodash.js');

exports.init = function (ctx, options) {
    return new LineChart(ctx, options);
};

function LineChart(ctx, options) {
    this.ctx = wx.createCanvasContext(ctx);
    this.tipsCtx = options.tipsCtx ? wx.createCanvasContext(options.tipsCtx) : null;

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

    if (_.isEmpty(this.options.lines)) {
        throw new Error('options.lines can not be empty');
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

LineChart.prototype.tipsByX = function (x) {
    if (!this.options.tipsCtx) {
        return;
    }

    let {
        tipsIndex
    } = this._attrs;
    let index = this._indexByX(x);
    if (index === tipsIndex) {
        return;
    }
    this._attrs.tipsIndex = index;

    this._tipsLineByIndex(index);
    this._tipsLabelByIndex(index);

    this.tipsCtx.draw();
};

LineChart.prototype.clearTips = function () {
    if (!this.options.tipsCtx) {
        return;
    }

    let {
        width,
        height
    } = this.options;

    this.tipsCtx.clearRect(0, 0, width, height);
    this.tipsCtx.draw();
};

LineChart.prototype._tipsLabelByIndex = function (index) {
    let {
        xAxis,
        xUnit,
        yUnit,
        margin
    } = this.options;
    let {
        xOffset
    } = this._attrs;

    let ctx = this.tipsCtx;
    ctx.setFontSize(12);

    let title = xAxis[index] + xUnit;
    let points = this._pointsByIndex(index);
    points = _.map(points, item => ({
        color: item.color,
        text: `${item.value}${yUnit}`,
        width: ctx.measureText(`${item.value}${yUnit}`).width + 15,
        x: item.x
    }));

    let width = _.max(_.map(points, item => item.width));
    width = Math.max(ctx.measureText(title).width, width) + 20;
    let fromX = points[0].x - width;
    if (fromX < xOffset) {
        fromX = points[0].x;
    }
    let endX = fromX + width;
    let fromY = margin;
    let endY = margin + (points.length + 1) * 18;

    // 背景
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(fromX, endY);
    ctx.lineTo(endX, endY);
    ctx.lineTo(endX, fromY);
    ctx.closePath();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = 'black';
    ctx.fill();

    // 文字
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'white';
    ctx.fillText(title, fromX + 10, fromY + 15);
    _.each(points, (item, index) => {
        let textY = fromY + 15 * (index + 2);

        ctx.beginPath();
        ctx.arc(fromX + 15, textY - 4, 5, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText(item.text, fromX + 25, textY);
    });
};

LineChart.prototype._tipsLineByIndex = function (index) {
    let {
        yOffset
    } = this._attrs;
    let {
        margin,
        labelColor
    } = this.options;

    let points = this._pointsByIndex(index);
    let ctx = this.tipsCtx;

    // 实心点
    _.each(points, item => {
        ctx.beginPath();
        ctx.arc(item.x, item.y, 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();
    });

    ctx.beginPath();
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = labelColor;
    ctx.moveTo(points[0].x, yOffset);
    ctx.lineTo(points[0].x, margin);
    ctx.stroke();
};

LineChart.prototype._indexByX = function (x) {
    let {
        xOffset,
        xStep
    } = this._attrs;
    let {
        xAxis
    } = this.options;

    let index = 0;
    if (x > xOffset) {
        index = Math.min(Math.round((x - xOffset) / xStep), xAxis.length - 1);
    }

    return index;
};

LineChart.prototype._pointsByIndex = function (index) {
    let {
        xOffset,
        xStep,
        yOffset,
        yStep
    } = this._attrs;

    return _.map(_.filter(this.options.lines, item => !item.hidden && !_.isUndefined(item.points[index])), item => ({
        x: xOffset + index * xStep,
        y: yOffset - item.points[index] * yStep,
        value: item.points[index],
        color: item.color
    }));
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

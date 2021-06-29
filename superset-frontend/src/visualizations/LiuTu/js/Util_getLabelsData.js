import {
    getRandom,
    numContains,
    numContainsByID,
    getNumElementIndex,
    getNumElementIndexByID,
    getNumElementByID,
    getNumElementsByAttribute,
    turnHighDimensionArraytoOneDimensionArray,
    zero_fill_hex,
    rgb2hex,
    getArray,
    getArray2D,
    getArray3D,
    shuffle,
    copyObject,
    getMedian,
    getDeviation,
    getStandardDeviation,
    getNumQuantiles,
    getNumOutlierByQuantiles,
    copyUrl2,
    getRandomColorRGB,
    getUnicode,
    A_Copy_Of
} from './lib/buchuan1023'

import * as d3 from 'd3597'     //引用v5.9.7的d3js文件

/**
 * 水平放置的label
 * 得到一个布局完毕的streamgraph上添加label所需要的数据
 * @param {已经布局完毕的layers} layers 
 * @param {要添加layers对应图的索引} graphIndex 
 * @param {要使用的X坐标轴} linearX 
 */
export function getLabelsData(layers, graphIndex, linearX) {
    let LabelData = [];
    //这里的Y坐标轴是有点怪，因为是反过来的。同时Y轴不是0-120=》0-1200这样的，而是-100-120=》0-1200
    let absInverseLinearY = d3.scaleLinear()
        .domain(linearY.range().slice().reverse())
        .range([0, Math.abs(linearY.domain()[0]) + Math.abs(linearY.domain()[1])]);

    // let max_Label_FontSize = 30;
    // let min_Label_FontSize = 5;

    let label_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        .append("g")
        .attr("id", "cur_myLabels_g_" + graphIndex)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    for (let i = 0; i < layers.length; i++) {
        // let initialName = layers[i].initialName;
        let layerName = layers[i].name;
        let layerID = layers[i].id;
        label_g.append("text")
            .attr("id", "cur_myLabels_g_" + graphIndex + "_" + layerID)
            .style("font-size", max_Label_FontSize + "px")
            .style("fill", "black")
            .text(layerName)
            // .text(initialName)
            .attr("transform", "translate(" + margin.left + "," + margin.top * 2 + ")")

        let thisFontSize = max_Label_FontSize;
        let final_X = 0, final_Y = 0, final_FontSize = 0;

        let thisLabelWidth_Graph, thisTextHeight_Graph;

        while (thisFontSize > min_Label_FontSize) {
            label_g.select("#" + "cur_myLabels_g_" + graphIndex + "_" + layerID)
                .style("font-size", thisFontSize + "px")

            {
                thisLabelWidth_Graph = undefined
                thisTextHeight_Graph = undefined
            }

            thisLabelWidth_Graph = document.getElementById("cur_myLabels_g_" + graphIndex + "_" + layerID).getBoundingClientRect().width
            thisTextHeight_Graph = document.getElementById("cur_myLabels_g_" + graphIndex + "_" + layerID).getBoundingClientRect().height
            // thisLabelWidth_Graph = document.getElementById("cur_myLabels_g_" + graphIndex + "_" + layerID).getBBox().width
            // thisTextHeight_Graph = document.getElementById("cur_myLabels_g_" + graphIndex + "_" + layerID).getBBox().height
            // let thisTextWidth_Data = linearX.invert(document.getElementById("cur_myLabels_g_" + graphIndex + "_" + layerID).getBoundingClientRect().width)
            let thisLabelHeight_Graph = absInverseLinearY(document.getElementById("cur_myLabels_g_" + graphIndex + "_" + layerID).getBoundingClientRect().height)

            let availabeSpace = getSildeWindow(thisLabelWidth_Graph, layers[i].yTop, layers[i].yBottom)

            let maxAvailabeSpace = -Infinity,
                maxAvailabeSpace_ceiling = undefined,
                maxAvailabeSpace_floor = undefined,
                maxAvailabeSpace_i = undefined

            for (let i = 0; i < availabeSpace.length; i++) {
                if (availabeSpace[i][0] > maxAvailabeSpace) {
                    maxAvailabeSpace = availabeSpace[i][0]
                    maxAvailabeSpace_ceiling = availabeSpace[i][1]
                    maxAvailabeSpace_floor = availabeSpace[i][2]
                    maxAvailabeSpace_i = availabeSpace[i][3]
                }
            }
            if (maxAvailabeSpace >= thisLabelHeight_Graph) {

                final_X = linearX(maxAvailabeSpace_i) - thisLabelWidth_Graph / 2
                // final_X = linearX(maxAvailabeSpace_i)

                // final_Y = linearY((maxAvailabeSpace_ceiling + maxAvailabeSpace_floor) / 2 - thisLabelHeight_Graph / 2 + thisLabelHeight_Graph / 3.5)
                final_Y = linearY((maxAvailabeSpace_ceiling + maxAvailabeSpace_floor) / 2)//这里修改了text的纵向对齐之后，就不用这样修改了。
                final_FontSize = thisFontSize;

                // label_g.select("#" + "cur_myLabels_g_" + graphIndex + "_" + name)
                //     .attr("transform", "translate(" + text_X + "," + text_Y + ")")
                //     .style("font-size", thisFontSize + "px")

                break;
            } else {
                thisFontSize -= Math.max(1, 0.1 * thisFontSize);
            }
        }
        if (thisFontSize < min_Label_FontSize) {
            final_X = width / 2
            final_Y = linearY(layers[i].yTop[Math.round(layers[i].yTop.length / 2)])
            final_FontSize = 0;
        }


        let thisLabelData = {};
        // thisLabelData.initialName = initialName;
        thisLabelData.id = layers[i].id;
        thisLabelData.name = layerName;
        thisLabelData.x = final_X;
        thisLabelData.y = final_Y;
        thisLabelData.fontsize = final_FontSize;
        thisLabelData.width = thisLabelWidth_Graph;
        thisLabelData.height = thisTextHeight_Graph;

        var color = layers[i].fillcolor;
        var values = color.substring(4, color.length - 1).split(",");
        var red = parseInt(values[0]) / 255;
        var green = parseInt(values[1]) / 255;
        var blue = parseInt(values[2]) / 255;
        var gamma = 2.2;
        var intensity =
            .2126 * Math.pow(red, gamma) +
            .7152 * Math.pow(green, gamma) +
            .0722 * Math.pow(blue, gamma);
        thisLabelData.lableColor = (intensity > 0.3 ? "black" : "white");
        thisLabelData.opacity = (intensity > 0.3 ? 0.5 : 0.7);

        LabelData.push(thisLabelData);

        label_g.select("#" + "cur_myLabels_g_" + graphIndex + "_" + layerID).remove()
    }


    /**
     * 得到：某一个layer，在放置某个字号的label的时候，使用滑动窗口方法，在每一个可能的timepoint位置(label的中心就在这个timepoint上)可以放置的最大高度
     * @param {这个label在这个字号下在图上宽度} width_graph 
     * @param {这个layer的top-border数组} T 
     * @param {这个layer的bottom-border数组} B 
     */
    function getSildeWindow(width_graph, T, B) {
        let start_Window = Math.ceil(linearX.invert(width_graph / 2)),
            end_Window = Math.floor(linearX.invert(linearX(T.length - 1) - width_graph / 2));

        let res = []//存储这个window的最大空间、天花板、地板、当前时间

        //这里的0.5是最核心的参数
        for (let i = start_Window; i <= end_Window; i += 0.5) {
            // for (let i = start_Window; i <= end_Window; i++) {

            let start = linearX.invert(linearX(i) - width_graph / 2)
            let end = linearX.invert(linearX(i) + width_graph / 2)


            let curT = getLinearValues(start, end, T)
            let curB = getLinearValues(start, end, B)

            let ceiling = curT.reduce((a, b) => (Math.min(a, b)))
            let floor = curB.reduce((a, b) => (Math.max(a, b)))

            // let cur_g = d3.select("#" + "myGraph_svg_" + graphIndex)
            //     .append("g")
            //     .attr("id", "cur_g")
            //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            //     .attr("width", width + margin.left + margin.right)
            //     .attr("height", height + margin.top + margin.bottom)


            // //画出这个点
            // cur_g.append("rect")
            //     .attr("x", currentLinearX(start))
            //     .attr("y", linearY(ceiling))
            //     .attr("width", currentLinearX(end) - currentLinearX(start))
            //     .attr("height", (linearY(floor) - linearY(ceiling))>0?(linearY(floor) - linearY(ceiling)):1)
            //     .style("fill", "black")
            //     .style("stroke", "red")
            //     .style("stroke-width", 1)
            // cur_g.remove()
            let maxSpace = ceiling - floor;
            res.push([maxSpace, ceiling, floor, i]);
        }
        return res;
    }

    /**
     * 得到一个滑动窗口的最大Y空间，返回值是天花板和地板的数值
     * @param {滑动窗口的起始坐标} start 
     * @param {滑动窗口的结束坐标} end 
     * @param {滑动窗口所在的数组} num 
     */
    function getLinearValues(start, end, num) {
        let res = []
        let i = start;
        if (isFloat(start)) {
            res.push(num[Math.floor(start)] + (num[Math.ceil(start)] - num[Math.floor(start)]) * (start - Math.floor(start)));
            i = Math.ceil(start);
        }
        for (i = Math.ceil(start); i <= end; i++) {
            res.push(num[Math.floor(i)] + (num[Math.ceil(i)] - num[Math.floor(i)]) * (i - Math.floor(i)));
        }
        if (isFloat(end)) {
            res.push(num[Math.floor(end)] + (num[Math.ceil(end)] - num[Math.floor(end)]) * (end - Math.floor(end)));
        }


        return res;
    }
    /**
     * 判断输入的值是不是float类型
     * @param {输入一个值} n 
     */
    function isFloat(n) {
        return n + ".0" != n;
    }

    label_g.remove()
    return LabelData;
}


/**
 * 斜着，弯弯曲曲放置的label
 * 
 * 获得layers图标的数据——Ours，要使用斜的layer标记方法
 * @param {已经布局好了的layers} layers 
 * @param {图ID} graphIndex 
 * @param {传入的X坐标轴} linearX 
 * keypoint:字号越大，所能容忍的label弯曲度越小，字号越小，容忍的label弯曲度越大，最大不超过30°
 * 得到一个layer和label
 * 1.遍历所有font-size，得到单个字符的宽度和高度
 *  2.遍历所有timepoint
 *   3.根据layer的中线，得到这个时间点的弯曲的label的baseline，和对应的滑动窗口（这个是关键）
 *    4.根据单个字符的宽度和高度，判断这个滑动窗口能不能放置这个字号的label
 *     5.YES:根据baseline画出label
 *       NO:font-size减小，下一步循环
 * 如何得到一个timepoint的label对应的baseline呢？
 *   首先可以画一个直的，得到baseline宽度和高度，然后得到这个时间点的滑动窗口（baseline是弯的，不是直的）
 *    
 * 全部使用图上的数据！彻底抛弃各种线性转换
 * 
 */
export function getLabelsData2(layers, graphIndex) {

    LineDrawer = d3.line()
        // .curve(d3.curveNatural)
        // .curve(d3.curveMonotoneX)
        .x(function (d) {
            return d.x
        })
        .y(function (d) {
            return d.y
        })

    let LabelData = [];

    //重写代码！！！全部使用图上的数据
    layers = JSON.parse(JSON.stringify(layers))
    for (let i = 0; i < layers.length; i++) {
        for (let j = 0; j < layers[i].yTop.length; j++) {
            layers[i].yTop[j] = new Point_Graph(currentLinearX(j), linearY(layers[i].yTop[j]), j)
            layers[i].yBottom[j] = new Point_Graph(currentLinearX(j), linearY(layers[i].yBottom[j]), j)
            //因为svg的y轴是从上到下的，所以这里我调整成了从下到上的
            // layers[i].yTop[j] = height - linearY(layers[i].yTop[j])
            // layers[i].yBottom[j] = height - linearY(layers[i].yBottom[j])
        }
    }

    let curLabel_g_ID = "cur_myLabels_g_" + graphIndex;

    let cur_labels_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        .append("g")
        .attr("id", curLabel_g_ID)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)


    let label_for_prepare = cur_labels_g.append("text")
        .attr("id", "cur_text_fontsize_height")
        .style("font-size", max_Label_FontSize + "px")
        .text("a")

    let cur_fontsize = max_Label_FontSize
    let num_Font_Size = [],
        num_Label_CharHeight = [],
        num_Label_Angle = []

    let linearFontsize_Angel = d3.scaleLinear()
        .domain([min_Label_FontSize, max_Label_FontSize])
        .range([min_Label_Angel, max_Label_Angel])

    while (cur_fontsize > min_Label_FontSize) {
        label_for_prepare.style("font-size", cur_fontsize + "px")
        num_Font_Size.push(cur_fontsize)
        num_Label_CharHeight.push(document.getElementById("cur_text_fontsize_height").getBoundingClientRect().height)
        num_Label_Angle.push(linearFontsize_Angel(cur_fontsize))
        cur_fontsize = (cur_fontsize - Math.max(1, 0.1 * cur_fontsize))
    }
    num_Label_Angle.reverse();
    label_for_prepare.remove();

    for (let i = 0; i < layers.length; i++) {
        let layerName = layers[i].name;
        if (layerName === "Jurassic World") {
            let cur = 1
        }
        let layerID = layers[i].id;
        let thisLabel = cur_labels_g.append("text")
            .attr("id", curLabel_g_ID + "_" + layerID)
            .style("font-size", "30px")
            .attr("transform", "translate(" + 100 + "," + 100 + ")")
            .text(layerName)

        let final_path = [[1, 1], [2, 2]], final_FontSize = -1;

        let thisFontSize = 0
        for (let j = 0; j < num_Font_Size.length; j++) {
            thisFontSize = num_Font_Size[j]
            thisLabel.style("font-size", thisFontSize + "px")

            let thisLabel_Length = document.getElementById(curLabel_g_ID + "_" + layerID).getBoundingClientRect().width
            let thisLabel_Height = num_Label_CharHeight[j]

            let usefulPath = runSildeWindow(thisLabel_Length, layers[i].yTop, layers[i].yBottom, num_Label_Angle[j], layers[i], thisLabel_Height)
            if (usefulPath.length > 0) {

                final_path = usefulPath;
                final_FontSize = thisFontSize;

                // thisLabel.remove()
                // thisLabel = cur_labels_g.append("text")
                //     .attr("width", width + margin.left + margin.right)
                //     .attr("height", height + margin.top + margin.bottom)


                // cur_labels_g.selectAll("path").remove()
                // let cur_line = cur_labels_g.selectAll("path")
                //     .data([usefulPath])
                //     .enter()
                //     .append("path")
                //     .attr("id", curLabel_g_ID + "_label_path_" + layerID)
                //     .style("stroke", "black")
                //     .style("stroke-width", 1)
                //     .style("fill", "none")
                //     .attr("d", LineDrawer)

                // thisLabel.append("textPath")
                //     .attr("xlink:href", "#"+curLabel_g_ID + "_label_path_" + layerID)
                //     // .attr("font-family", "monospace")
                //     .attr("font-size", thisFontSize + "px")
                //     .attr("dominant-baseline", "middle")
                //     .text(layerName)

                // xlink:href="#my_path1" font-family="monospace" font-size="60" dominant-baseline="middle"
                break;
            }
        }


        if (final_FontSize === -1) {
            final_path = [new Point_Graph(0, 0, -1)]
            final_FontSize = 0
        }

        let thisLabelData = {};
        thisLabelData.id = layerID;
        thisLabelData.name = layerName;
        thisLabelData.label_path = final_path;
        thisLabelData.fontsize = final_FontSize;

        var color = layers[i].fillcolor;
        var values = color.substring(4, color.length - 1).split(",");
        var red = parseInt(values[0]) / 255;
        var green = parseInt(values[1]) / 255;
        var blue = parseInt(values[2]) / 255;
        var gamma = 2.2;
        var intensity =
            .2126 * Math.pow(red, gamma) +
            .7152 * Math.pow(green, gamma) +
            .0722 * Math.pow(blue, gamma);
        thisLabelData.lableColor = (intensity > 0.3 ? "black" : "white");
        thisLabelData.opacity = (intensity > 0.3 ? 0.5 : 0.7);

        // thisLabelData.fillcolor = 
        LabelData.push(thisLabelData);
        // cur_labels_g.select("#" + "cur_myLabels_g_" + graphIndex + "_" + layerID).remove()
        cur_labels_g.selectAll("text").remove()
    }
    cur_labels_g.remove()
    return LabelData;
    /**
     * 得到某个字号的label在这个label上对应的所有滑动窗口的数据，这个字号已经通过label_Length体现出来了
     * @param {要放置的label在图上的宽度} label_Length 
     * @param {这个layer的yTopyBaseline数组} yT 
     * @param 这个layer的yBottomyBaseline数组 yB 
     * @param {这个label可以接受的弯曲角度} angel,所有的角度都是从右侧逆时针旋转的
     */
    function runSildeWindow(label_Length, yT, yB, angel, thisLayer, height_graph) {

        let max_Tan_Angel = Math.tan(angel * (Math.PI / 180))

        let MiddleLine = yT.map(function (value, i) {
            return new Point_Graph(value.x, (value.y + yB[i].y) / 2, i)
        })

        let start_Window_Index = undefined,
            end_Window_Index = undefined

        for (let i = thisLayer.onset; i < MiddleLine.length; i++) {
            if (MiddleLine[i].x - MiddleLine[thisLayer.onset].x >= label_Length / 2) {
                start_Window_Index = i
                break
            }
        }
        for (let i = thisLayer.end; i >= 0; i--) {
            if (MiddleLine[thisLayer.end].x - MiddleLine[i].x >= label_Length / 2) {
                end_Window_Index = i
                break
            }
        }

        // let windows = []//存储的是所有合法的baseline，不考虑字号

        let useful_windows = []
        // for (let i = start_Window_Index; i <= end_Window_Index; i++) {

        //     let current_Length = 0;//存储当前baseline已经延伸了的长度
        //     let curWindow = []//这里面push进去的是图上的点的坐标
        //     curWindow.push(MiddleLine[i]);
        for (let i = start_Window_Index; i <= end_Window_Index; i++) {
            // for (let i = start_Window_Index; i <= end_Window_Index; i +=0.5) {

            let current_Length = 0;//存储当前baseline已经延伸了的长度
            let curWindow = []//这里面push进去的是图上的点的坐标
            let Middle_Index_Right = i
            let Middle_Index_Left = i
            if (isFloat(i)) {
                curWindow.push(MiddleLine[Math.floor(i)]);
                curWindow.push(MiddleLine[Math.ceil(i)]);
                Middle_Index_Left = Math.floor(i)
                Middle_Index_Right = Math.ceil(i)
                // Middle_Index_Left = Math.floor(i)
                // Middle_Index_Right = Math.ceil(i)
                current_Length = getPoint_distance(MiddleLine[Math.floor(i)], MiddleLine[Math.ceil(i)])
            } else {
                curWindow.push(MiddleLine[i]);
            }


            //下面计算path都是用的图上的距离，currentLinearX
            //首先向右计算PATH
            for (let j = Middle_Index_Right + 1; j < MiddleLine.length; j++) {
                let dX = MiddleLine[j].x - MiddleLine[j - 1].x//这里的dx必然是同号的
                let dY = MiddleLine[j].y - MiddleLine[j - 1].y//这里的dy有正有负，反映了角度
                let this_Tan_Angel = dY / dX
                if (Math.abs(this_Tan_Angel) <= max_Tan_Angel) {
                    let this_Length = Math.sqrt(dX * dX + dY * dY)
                    if ((current_Length + this_Length) < label_Length / 2) {
                        let X_toAdd = curWindow[curWindow.length - 1].x + dX
                        let Y_toAdd = curWindow[curWindow.length - 1].y + dY
                        curWindow.push(new Point_Graph(X_toAdd, Y_toAdd, j))
                        current_Length += this_Length
                    } else {
                        //这里使用的三角形的等比定理
                        let remaining_Length = label_Length / 2 - current_Length
                        let deltaX = dX * (remaining_Length / this_Length)
                        let deltaY = dY * (remaining_Length / this_Length)

                        let X_toAdd = curWindow[curWindow.length - 1].x + deltaX//这里不需要分类讨论
                        let Y_toAdd = curWindow[curWindow.length - 1].y + deltaY//这里的deltaY是有符号的，所以不需要进行分类讨论

                        curWindow.push(new Point_Graph(X_toAdd, Y_toAdd, currentLinearX.invert(X_toAdd)))
                        current_Length = label_Length / 2
                        break;
                    }
                } else {

                    this_Tan_Angel = max_Tan_Angel * (this_Tan_Angel > 0 ? 1 : -1);//得到新角度，也是有正负号的

                    let new_dY = dX * this_Tan_Angel;
                    let this_Length = Math.sqrt(dX * dX + new_dY * new_dY);

                    if ((current_Length + this_Length) < label_Length / 2) {
                        let X_toAdd = curWindow[curWindow.length - 1].x + dX
                        let Y_toAdd = curWindow[curWindow.length - 1].y + new_dY
                        curWindow.push(new Point_Graph(X_toAdd, Y_toAdd, j))
                        current_Length += this_Length
                    } else {
                        //这里使用的三角形的等比定理
                        let remaining_Length = label_Length / 2 - current_Length
                        let deltaX = dX * (remaining_Length / this_Length)
                        let new_deltaY = new_dY * (remaining_Length / this_Length)

                        let X_toAdd = curWindow[curWindow.length - 1].x + deltaX
                        let Y_toAdd = curWindow[curWindow.length - 1].y + new_deltaY

                        curWindow.push(new Point_Graph(X_toAdd, Y_toAdd, currentLinearX.invert(X_toAdd)))
                        current_Length = label_Length / 2
                        break;
                    }
                }

            }
            current_Length = 0
            //然后向左计算PATH
            for (let j = Middle_Index_Left - 1; j >= 0; j--) {
                let dX = MiddleLine[j + 1].x - MiddleLine[j].x//这里的dx必然是同号的
                let dY = MiddleLine[j + 1].y - MiddleLine[j].y//这里的dy有正有负，反映了角度
                let this_Tan_Angel = dY / dX
                if (Math.abs(this_Tan_Angel) <= max_Tan_Angel) {
                    let this_Length = Math.sqrt(dX * dX + dY * dY)
                    if ((current_Length + this_Length) < label_Length / 2) {
                        let X_toAdd = curWindow[0].x - dX
                        let Y_toAdd = curWindow[0].y - dY
                        curWindow.unshift(new Point_Graph(X_toAdd, Y_toAdd, j))
                        current_Length += this_Length
                    } else {
                        //这里使用的三角形的等比定理
                        let remaining_Length = label_Length / 2 - current_Length
                        let deltaX = dX * (remaining_Length / this_Length)
                        let deltaY = dY * (remaining_Length / this_Length)

                        let X_toAdd = curWindow[0].x - deltaX//这里不需要分类讨论
                        let Y_toAdd = curWindow[0].y - deltaY//这里的deltaY是有符号的，所以不需要进行分类讨论

                        curWindow.unshift(new Point_Graph(X_toAdd, Y_toAdd, currentLinearX.invert(X_toAdd)))
                        current_Length = label_Length / 2
                        break;
                    }
                } else {

                    this_Tan_Angel = max_Tan_Angel * (this_Tan_Angel > 0 ? 1 : -1);//得到新角度，也是有正负号的
                    let new_dY = dX * this_Tan_Angel;//有正负号
                    let this_Length = Math.sqrt(dX * dX + new_dY * new_dY);

                    if ((current_Length + this_Length) < label_Length / 2) {
                        let X_toAdd = curWindow[0].x - dX
                        let Y_toAdd = curWindow[0].y - new_dY
                        curWindow.unshift(new Point_Graph(X_toAdd, Y_toAdd, j))
                        current_Length += this_Length
                    } else {
                        //这里使用的三角形的等比定理
                        let remaining_Length = label_Length / 2 - current_Length
                        let deltaX = dX * (remaining_Length / this_Length)
                        let new_deltaY = new_dY * (remaining_Length / this_Length)

                        let X_toAdd = curWindow[0].x - deltaX//这里不需要分类讨论
                        let Y_toAdd = curWindow[0].y - new_deltaY//这里的deltaY是有符号的，所以不需要进行分类讨论

                        curWindow.unshift(new Point_Graph(X_toAdd, Y_toAdd, currentLinearX.invert(X_toAdd)))
                        current_Length = label_Length / 2

                        break;
                    }
                }

            }

            // let cur_line, cur_point
            // if (drawGeneratedLine_Point) {
            //     cur_line = cur_labels_g.selectAll("path")
            //         // .data(windows)
            //         .data([curWindow])
            //         .enter()
            //         .append("path")
            //         .attr("class", "label_line")
            //         .attr("d", LineDrawer)
            //         .attr("stroke", "white")
            //         .attr("stroke-width", 2)
            //         .attr("fill", "none")

            //     cur_point = cur_labels_g.append("circle")
            //         .attr("cx", (MiddleLine[Middle_Index_Left].x + MiddleLine[Middle_Index_Right].x) / 2)
            //         .attr("cy", (MiddleLine[Middle_Index_Left].y + MiddleLine[Middle_Index_Right].y) / 2)
            //         .attr("r", 2)
            //         .attr("fill", "yellow")
            // }

            //首先去除无效的窗口，也就是baseline不在layer中间的baseline
            let isLegal_curWindow = true;

            let min_Vertical_Distance_T = Infinity
            let min_Vertical_Distance_B = Infinity

            for (let j = 0; j < curWindow.length; j++) {
                let thisyTop = getIndexValue(yT, curWindow[j].index);//图上yTop在上面，但是Y坐标在下面
                let thisyBottom = getIndexValue(yB, curWindow[j].index);//图上yBottom在下面，但是数据上yBottom在上面
                //注意这里上一行不加分号的话会报错，因为编译的时候，会把下面的中括号和上一行的代码连到一起
                // if (curWindow[j].y <= thisyTop || curWindow[j].y >= thisyBottom) {
                //     isLegal_curWindow = false;
                //     break
                // } else {
                //     min_Vertical_Distance_T = Math.min(min_Vertical_Distance_T, curWindow[j].y - thisyTop)
                //     min_Vertical_Distance_B = Math.min(min_Vertical_Distance_B, thisyBottom - curWindow[j].y)
                // }
                min_Vertical_Distance_T = Math.min(min_Vertical_Distance_T, curWindow[j].y - thisyTop)
                min_Vertical_Distance_B = Math.min(min_Vertical_Distance_B, thisyBottom - curWindow[j].y)
            }

            let vertical_distance_toMove_Up = (min_Vertical_Distance_T - min_Vertical_Distance_B) / 2
            for (let j = 0; j < curWindow.length; j++) {
                curWindow[j].y -= vertical_distance_toMove_Up
            }

            // if (drawGeneratedLine_Point) {
            //     cur_labels_g.selectAll("path").remove()
            //     cur_line = cur_labels_g.selectAll("path")
            //         // .data(windows)
            //         .data([curWindow])
            //         .enter()
            //         .append("path")
            //         .attr("class", "label_line")
            //         .attr("d", LineDrawer)
            //         .attr("stroke", "white")
            //         .attr("stroke-width", 2)
            //         .attr("fill", "none")
            // }

            for (let j = 0; j < curWindow.length; j++) {
                let thisyTop = getIndexValue(yT, curWindow[j].index);//图上yTop在上面，但是Y坐标在下面
                let thisyBottom = getIndexValue(yB, curWindow[j].index);//图上yBottom在下面，但是数据上yBottom在上面
                // 注意这里上一行不加分号的话会报错，因为编译的时候，会把下面的中括号和上一行的代码连到一起
                if (curWindow[j].y <= thisyTop || curWindow[j].y >= thisyBottom) {
                    isLegal_curWindow = false;
                    break
                }
            }
            if (!isLegal_curWindow) {
                // if (drawGeneratedLine_Point) {
                //     cur_point.remove()
                //     cur_line.remove()
                // }
                continue
            }

            //好的现在我们已经得到了这个滑动窗口的baseline！接下来要计算的是这个baseline对应的上下边界

            // windows.push(curWindow)
            /**接下来就要计算以这个baseline为中心能不能放置开label了
             *      其实这个baseline只能够确定最终字条的一个形状，不能够确定最终的位置
             *      但是要那么做的话，必须要一个像素一个像素的遍历，效率会很低，这里我就直接使用中线得到的baseline了
             */
            let curWindow_vertical_distance = isUseful_Window(curWindow, yT, yB, height_graph)
            if (curWindow_vertical_distance[0]) {
                useful_windows.push([JSON.parse(JSON.stringify(curWindow)), curWindow_vertical_distance[1], curWindow_vertical_distance[2]])
            }
            // if (drawGeneratedLine_Point) {
            //     cur_point.remove()
            //     cur_line.remove()
            // }
        }

        let result_windows = []//最终的结果
        if (useful_windows.length > 0) {

            // cur_labels_g.selectAll("path").remove()

            // let cur_line = cur_labels_g.selectAll("path")
            //     // .data(windows)
            //     .data(useful_windows.map(d => d[0]))
            //     .enter()
            //     .append("path")
            //     .attr("class", "label_line")
            //     .attr("d", LineDrawer)

            //     cur_line.remove()

            // let vertical_distance_yT = Infinity
            // let vertical_distance_yB = Infinity
            // let vertical_distance_yTyB_sum = 0
            // let min_Vertical_Distance = -Infinity

            // for (let i = 0; i < useful_windows.length; i++) {
            //     vertical_distance_yT = Infinity
            //     vertical_distance_yB = Infinity
            //     for (let j = 0; j < useful_windows[i][1].length; j++) {
            //         vertical_distance_yT = Math.min(vertical_distance_yT, useful_windows[i][1][j])
            //         vertical_distance_yB = Math.min(vertical_distance_yB, useful_windows[i][2][j])
            //         vertical_distance_yTyB_sum = vertical_distance_yT + vertical_distance_yB
            //     }
            //     if (vertical_distance_yTyB_sum > min_Vertical_Distance) {
            //         min_Vertical_Distance = vertical_distance_yTyB_sum
            //         result_windows = useful_windows[i][0]
            //     }
            // }
            let distance_yT_sum = 0
            let distance_yB_sum = 0
            let total_distance_mean = 0
            let max_total_distance_mean = -Infinity

            for (let i = 0; i < useful_windows.length; i++) {
                distance_yT_sum = 0
                distance_yB_sum = 0
                for (let j = 0; j < useful_windows[i][1].length; j++) {
                    distance_yT_sum += useful_windows[i][1][j]
                    distance_yB_sum += useful_windows[i][2][j]
                }
                total_distance_mean = (distance_yT_sum + distance_yB_sum) / (useful_windows[i][1].length + useful_windows[i][2].length)
                // distance_yT_sum /= useful_windows[i][1].length
                // distance_yB_sum /= useful_windows[i][2].length
                if (total_distance_mean > max_total_distance_mean) {
                    max_total_distance_mean = total_distance_mean
                    result_windows = useful_windows[i][0]
                }
            }
            return result_windows
        } else {
            return result_windows
        }
    }
    /**
     * 判断一个滑动窗口是否是有效的
     *      判断方式是逐个判断yB,yT上的所有点到baseline的垂线距离是否大于height_data/2，如果垂线不落在baseline上就忽略
     * @param {滑动窗口} slideWindow 
     * @param {滑动窗口所在layer的上边界} yT 
     * @param {滑动窗口所在layer的下边界} yB 
     * @param {滑动窗口对应label的高度} height_graph 
     */
    function isUseful_Window(slideWindow, yT, yB, height_graph) {
        let res_vertical_distance_yT = []
        let res_vertical_distance_yB = []

        //这里的baselineStart和baselineEnd需要重写，需要是两个端点的垂线与上下边界的交点作为边界
        //slideWindow起始点对应的topbaseline坐标
        let y_gap_graph_slide_window_start = slideWindow[1].y - slideWindow[0].y
        let x_gap_graph_slide_window_start = slideWindow[1].x - slideWindow[0].x
        //slidewindow起点的斜率
        let k_graph = y_gap_graph_slide_window_start / x_gap_graph_slide_window_start
        let start_Point_yT = new Point_Graph(slideWindow[0].x, getIndexValue(yT, slideWindow[0].index), slideWindow[0].index)
        let start_Point_yB = new Point_Graph(slideWindow[0].x, getIndexValue(yB, slideWindow[0].index), slideWindow[0].index)
        // if (Math.abs(k_graph) > 0.01) {
        //     k_graph = -1 / k_graph;
        //     let cur1,cur2;
        //     // [start_Point_yT, start_Point_yB] = getIntersectPoint_Point_LineSegments(slideWindow[0], k_graph, yT, yB);
        //     [cur1, cur2] = getIntersectPoint_Point_LineSegments(slideWindow[0], k_graph, yT, yB);
        //     if(cur1.x<start_Point_yT.x){
        //         start_Point_yT = cur1
        //     }
        //     if(cur2.x<start_Point_yB.x){
        //         start_Point_yT = cur2
        //     }
        // }
        //slideWindow起始点对应的bottombaseline坐标
        let y_gap_graph_slide_window_end = slideWindow[slideWindow.length - 1].y - slideWindow[slideWindow.length - 2].y
        let x_gap_graph_slide_window_end = slideWindow[slideWindow.length - 1].x - slideWindow[slideWindow.length - 2].x
        //slidewindow终点的斜率
        k_graph = y_gap_graph_slide_window_end / x_gap_graph_slide_window_end
        let end_Point_yT = new Point_Graph(slideWindow[slideWindow.length - 1].x, getIndexValue(yT, slideWindow[slideWindow.length - 1].index), slideWindow[slideWindow.length - 1].index)
        let end_Point_yB = new Point_Graph(slideWindow[slideWindow.length - 1].x, getIndexValue(yB, slideWindow[slideWindow.length - 1].index), slideWindow[slideWindow.length - 1].index)

        // if (Math.abs(k_graph) > 0.01) {
        //     k_graph = -1 / k_graph;
        //     let cur1,cur2;
        //     // [end_Point_yT, end_Point_yB] = getIntersectPoint_Point_LineSegments(slideWindow[slideWindow.length - 1], k_graph, yT, yB);
        //     [cur1, cur2] = getIntersectPoint_Point_LineSegments(slideWindow[slideWindow.length - 1], k_graph, yT, yB);
        //     if(cur1.x>end_Point_yT.x){
        //         end_Point_yT = cur1
        //     }
        //     if(cur2.x>end_Point_yB.x){
        //         end_Point_yT = cur2
        //     }
        // }


        //获得label——baseline对应的yTopyBaseline
        let label_yT = [start_Point_yT]
        for (let i = Math.ceil(start_Point_yT.index); i <= Math.floor(end_Point_yT.index); i++) {
            label_yT.push(yT[i])
        }

        label_yT.push(end_Point_yT)

        //获得label——baseline对应的yBottomyBaseline
        let label_yB = [start_Point_yB]
        for (let i = Math.ceil(start_Point_yB.index); i <= Math.floor(end_Point_yB.index); i++) {
            label_yB.push(yB[i])
        }
        label_yB.push(end_Point_yB)

        for (let i = 0; i < label_yT.length; i++) {
            if (label_yT[i].y !== getIndexValue(yB, label_yT[i].index)) {//厚度不为0才行
                let thisPoint_yT = label_yT[i]
                let thisPoint_yT_MinDistance_LineSegments = getMinDistance_Point_LineSegments(thisPoint_yT, slideWindow);
                if (thisPoint_yT_MinDistance_LineSegments < height_graph / 2) {
                    return [false]
                }
                res_vertical_distance_yT.push(thisPoint_yT_MinDistance_LineSegments)
            }
        }

        for (let i = 0; i < label_yB.length; i++) {
            if (label_yB[i].y !== getIndexValue(yT, label_yB[i].index)) {//厚度不为0才行
                let thisPoint_yB = label_yB[i]
                let thisPoint_yB_MinDistance_LineSegments = getMinDistance_Point_LineSegments(thisPoint_yB, slideWindow);
                if (thisPoint_yB_MinDistance_LineSegments < height_graph / 2) {
                    return [false]
                }
                res_vertical_distance_yB.push(thisPoint_yB_MinDistance_LineSegments)
            }
        }

        return [true, res_vertical_distance_yT, res_vertical_distance_yB]
    }
    /**
     * 得到一个点，到一些线段之间的垂线距离（如果这个点的垂线不落在这些线段上就返回与两个端点之间的最近距离）
     * @param {点的坐标_data} point 
     * @param {线段的点坐标_data} lineSegments 
     */
    function getMinDistance_Point_LineSegments(point, lineSegments) {


        // let cur_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        //     .append("g")
        //     .attr("id", "cur_g")
        //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        // //画出这个点
        // cur_g.append("circle")
        //     .attr("r", 3)
        //     .attr("cx", point.x)
        //     .attr("cy", point.y)

        let min_distance = Infinity;

        for (let i = 0; i < lineSegments.length - 1; i++) {
            let this_LineSegment = [lineSegments[i], lineSegments[i + 1]]
            let this_min_distance = getMinDistance_Point_LineSegment(point, this_LineSegment)
            min_distance = Math.min(min_distance, this_min_distance)
        }
        // cur_g.remove()
        return min_distance;
    }

    /**
     * 点到线段的距离（如果这个点的垂线不落在这个线段上就返回到两个端点之间的最近距离）
     * @param {点坐标} point 
     * @param {线段端点的坐标} lineSegment 
     * https://blog.csdn.net/wbb1997/article/details/80155138
     * 这里不能使用法向量，是因为我们要得到最短距离，而不仅仅是点到线段所在直线的垂线的距离
     * 使用法向量的网页https://www.cnblogs.com/wantnon/p/6384543.html
     */
    function getMinDistance_Point_LineSegment(point, lineSegment) {

        // let cur_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        //     .append("g")
        //     .attr("id", "cur_g")
        //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        //     .attr("width", width + margin.left + margin.right)
        //     .attr("height", height + margin.top + margin.bottom)

        // // 画出这个线段
        // cur_g.selectAll("path")
        //     .data([lineSegment])
        //     .enter()
        //     .append("path")
        //     .attr("class", "label_line")
        //     .attr("d", LineDrawer)
        //     .style("stroke", "black")
        // cur_g.remove()

        let Xp = point.x, Yp = point.y;
        let Xa = lineSegment[0].x, Ya = lineSegment[0].y,
            Xb = lineSegment[1].x, Yb = lineSegment[1].y;
        let AB = [Xb - Xa, Yb - Ya], AP = [Xp - Xa, Yp - Ya];

        let r = (AP[0] * AB[0] + AP[1] * AB[1]) / (AB[0] * AB[0] + AB[1] * AB[1])
        if (r >= 0 && r <= 1) {
            let length_AC = Math.sqrt(AB[0] * AB[0] + AB[1] * AB[1]) * r;
            let length_AP = Math.sqrt(AP[0] * AP[0] + AP[1] * AP[1])
            let length_CP = Math.sqrt(length_AP * length_AP - length_AC * length_AC)
            return length_CP;
        } else if (r > 1) {
            let yBP = [Xp - Xb, Yp - Yb]
            let length_BP = Math.sqrt(yBP[0] * yBP[0] + yBP[1] * yBP[1])
            return length_BP;
            return Infinity
            // return -1
        } else {
            let AP = [Xp - Xa, Yp - Ya]
            let length_AP = Math.sqrt(AP[0] * AP[0] + AP[1] * AP[1])
            return length_AP;
            return Infinity
            // return -1
        }
    }

    /**
     * 根据index获得对应的Y_graph值
     * @param {点坐标数组,存储着x,y,index }num
     * @param {索引,不一定是整数} index 
     */
    function getIndexValue(num, index) {
        if (index < 0 || index > num.length - 1) {
            throw "getIndexValue 索引错误: " + index
        }
        for (let i = 0; i < num.length; i++) {
            if (num[i].index > index) {
                let k = (index - num[i - 1].index) / (num[i].index - num[i - 1].index)
                return num[i - 1].y + k * ((num[i].y - num[i - 1].y))
            }
        }
    }

    /**
    * 判断输入的值是不是float类型
    * @param {输入一个值} n 
    */
    function isFloat(n) {
        return n + ".0" != n;
    }

    /**
     * 得到一个直线和一些线段们的交点，如果有多个交点，取距离point最近的那个
     * @param {点坐标} point 
     * @param {通过这个点的直线的斜率} k_graph
     * @param {线段们的坐标,是yB或者yT} lineSegments 
     * 将每个线段的起点和终点分别称之为A,yB
     */
    function getIntersectPoint_Point_LineSegments(point, k_graph, yT, yB) {

        let res_Point_Pair = []

        let cur_Point = new Point_Graph(point.x - 10, point.y - 10 * k_graph, -1)

        let thisLine = [cur_Point, point]

        let cur_Point1 = new Point_Graph(point.x - 10, point.y - 10 * k_graph, -1)
        let cur_Point2 = new Point_Graph(point.x + 10, point.y + 10 * k_graph, -1)

        // // 画出这条垂线
        // let curLine = [cur_Point1, point, cur_Point2]
        // let cur_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        //     .append("g")
        //     .attr("id", "cur_g")
        //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        //     .attr("width", width + margin.left + margin.right)
        //     .attr("height", height + margin.top + margin.bottom)
        // cur_g.selectAll("path")
        //     .data([curLine])
        //     .enter()
        //     .append("path")
        //     .attr("class", "label_line")
        //     .attr("d", d3.line()
        //         .x(function (d) {
        //             return d.x;
        //         })
        //         .y(function (d) {
        //             return d.y
        //         }))
        //     .style("stroke", "green")

        let intersect_Points_T = []
        for (let i = 0; i < yT.length - 1; i++) {
            //厚度为0的地方不考虑
            if (Math.abs(yT[i].y - yB[i].y) < 0.001 && Math.abs(yT[i + 1].y - yB[i + 1].y) < 0.001) {
                continue
            }
            let this_LineSegment = [yT[i], yT[i + 1]]
            let signed_vertical_distance_point_line_A = getSigned_Vertical_Distance_Point_Line(this_LineSegment[0], thisLine)
            let signed_vertical_distance_point_line_B = getSigned_Vertical_Distance_Point_Line(this_LineSegment[1], thisLine)
            if (signed_vertical_distance_point_line_A * signed_vertical_distance_point_line_B <= 0) {
                let K = 0.5
                let abs_vertical_distance_point_line_A = Math.abs(signed_vertical_distance_point_line_A)
                let abs_vertical_distance_point_line_B = Math.abs(signed_vertical_distance_point_line_B)
                if (abs_vertical_distance_point_line_A + abs_vertical_distance_point_line_B > 0) {
                    K = abs_vertical_distance_point_line_A / (abs_vertical_distance_point_line_A + abs_vertical_distance_point_line_B)
                }
                let intersectPoint = new Point_Graph(this_LineSegment[0].x + K * (this_LineSegment[1].x - this_LineSegment[0].x),
                    this_LineSegment[0].y + K * (this_LineSegment[1].y - this_LineSegment[0].y),
                    currentLinearX.invert(this_LineSegment[0].x + K * (this_LineSegment[1].x - this_LineSegment[0].x)))
                intersect_Points_T.push(intersectPoint)
            } else {
                continue
            }
        }
        if (intersect_Points_T.length === 1) {
            //只有一个交点
            res_Point_Pair[0] = intersect_Points_T[0]
        } else if (intersect_Points_T.length > 1) {
            //多个交点
            res_Point_Pair[0] = intersect_Points_T[0]
            let cur = getPoint_distance(res_Point_Pair[0], point)
            for (let i = 1; i < intersect_Points_T.length; i++) {
                let cur2 = getPoint_distance(intersect_Points_T[i], point)
                if (cur2 < cur) {
                    cur = cur2
                    res_Point_Pair[0] = intersect_Points_T[i]
                }
            }
        } else {
            //没有交点
            if (k_graph < 0) {//如果垂线是往右斜的
                res_Point_Pair[0] = yT[yT.length - 1]
            } else {
                res_Point_Pair[0] = yT[0]
            }
        }

        let intersect_Points_B = []
        for (let i = 0; i < yB.length - 1; i++) {
            //厚度为0的地方不考虑
            if (Math.abs(yT[i].y - yB[i].y) < 0.001 && Math.abs(yT[i + 1].y - yB[i + 1].y) < 0.001) {
                continue
            }
            let this_LineSegment = [yB[i], yB[i + 1]]
            let signed_vertical_distance_point_line_A = getSigned_Vertical_Distance_Point_Line(this_LineSegment[0], thisLine)
            let signed_vertical_distance_point_line_B = getSigned_Vertical_Distance_Point_Line(this_LineSegment[1], thisLine)
            if (signed_vertical_distance_point_line_A * signed_vertical_distance_point_line_B <= 0) {
                let K = 0.5
                let abs_vertical_distance_point_line_A = Math.abs(signed_vertical_distance_point_line_A)
                let abs_vertical_distance_point_line_B = Math.abs(signed_vertical_distance_point_line_B)
                if (abs_vertical_distance_point_line_A + abs_vertical_distance_point_line_B > 0) {
                    K = abs_vertical_distance_point_line_A / (abs_vertical_distance_point_line_A + abs_vertical_distance_point_line_B)
                }
                let intersectPoint = new Point_Graph(this_LineSegment[0].x + K * (this_LineSegment[1].x - this_LineSegment[0].x),
                    this_LineSegment[0].y + K * (this_LineSegment[1].y - this_LineSegment[0].y),
                    currentLinearX.invert(this_LineSegment[0].x + K * (this_LineSegment[1].x - this_LineSegment[0].x)))
                intersect_Points_B.push(intersectPoint)
            } else {
                continue
            }
        }

        if (intersect_Points_B.length === 1) {
            res_Point_Pair[1] = intersect_Points_B[0]
        } else if (intersect_Points_B.length > 1) {
            //多个交点
            res_Point_Pair[1] = intersect_Points_B[0]
            let cur = getPoint_distance(res_Point_Pair[1], point)
            for (let i = 1; i < intersect_Points_B.length; i++) {
                let cur2 = getPoint_distance(intersect_Points_B[i], point)
                if (cur2 < cur) {
                    cur = cur2
                    res_Point_Pair[1] = intersect_Points_B[i]
                }
            }
        } else {
            //没有交点
            if (k_graph < 0) {//如果垂线是往右斜的
                res_Point_Pair[1] = yB[0]
            } else {
                res_Point_Pair[1] = yB[yB.length - 1]
            }
        }

        //画出交点
        // cur_g.selectAll("circle")
        //     .data(res_Point_Pair)
        //     .enter()
        //     .append("circle")
        //     .attr("r", 3)
        //     .attr("cx", d => d.x)
        //     .attr("cy", d => d.y)
        // cur_g.remove()
        return res_Point_Pair;
    }
    /**
     * 得到点到直线的符号距离（根据直线的左手法向量来判断）
     * @param {点} point 
     * @param {直线} line 
     * https://www.cnblogs.com/flyinggod/p/9359534.html
     * 要在上面这个网页的基础上加一些修改
     */
    function getSigned_Vertical_Distance_Point_Line(point, line) {
        //直线的法向量
        let line_vertor = [line[1].x - line[0].x, line[1].y - line[0].y]
        //直线的左手法向量
        let left_normal_vector_line = [-line_vertor[1], line_vertor[0]]
        let AB = left_normal_vector_line;
        let AP = [point.x - line[0].x, point.y - line[0].y]
        let r = (AP[0] * AB[0] + AP[1] * AB[1]) / (AB[0] * AB[0] + AB[1] * AB[1])//这里的r本来就是带符号的，后面不用判断r的正负号了
        let length_AC = r * Math.sqrt(AB[0] * AB[0] + AB[1] * AB[1])
        return length_AC
        // if (r >= 0) {
        //     return length_AC
        // } else {
        //     return -length_AC;
        // }
    }
    /**
     * 得到两点间的距离
     * @param {点1} a 
     * @param {点2} b 
     */
    function getPoint_distance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
    }

}

export class Point_Graph {
    constructor(x, y, index) {
        this.x = x;
        this.y = y;
        this.index = index;
    }
}


/**
 * 斜着，直线放置的label
 * 获得layers图标的数据——Ours，要使用斜的layer标记方法
 * @param {已经布局好了的layers} layers 
 * @param {图ID} graphIndex 
 * 
 */
export function getLabelsData3(layers, graphIndex) {

    let draw_Final_Label = false

    LineDrawer = d3.line()
        .x(function (d) {
            return d.x
        })
        .y(function (d) {
            return d.y
        })

    let LabelData = [];

    //重写代码！！！全部使用图上的数据
    layers = JSON.parse(JSON.stringify(layers))
    for (let i = 0; i < layers.length; i++) {
        for (let j = 0; j < layers[i].yTop.length; j++) {
            layers[i].yTop[j] = new Point_Graph(currentLinearX(j), linearY(layers[i].yTop[j]), j)
            layers[i].yBottom[j] = new Point_Graph(currentLinearX(j), linearY(layers[i].yBottom[j]), j)
        }
    }


    // d3.select("#" + "myGraph_svg_" + graphIndex)
    //     .attr("transform", "rotate(180)scale(-1,1)")

    let cur_labels_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        .append("g")
        .attr("name", "用来暂时存储要计算的label")
        .attr("id", "cur_myLabels_g_" + graphIndex)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)


    let currentLabel = cur_labels_g.append("text")
        .attr("id", "currentLabel_")
        .style("font-size", max_Label_FontSize + "px")
        .attr("transform", "translate(" + 100 + "," + 100 + ")")
        .text("frog")

    let cur_fontsize = max_Label_FontSize
    let num_Font_Size = [],
        num_Label_CharHeight = []

    while (cur_fontsize > min_Label_FontSize) {
        currentLabel.style("font-size", cur_fontsize + "px")
        num_Font_Size.push(cur_fontsize)
        num_Label_CharHeight.push(document.getElementById("currentLabel_").getBoundingClientRect().height)
        cur_fontsize = (cur_fontsize - Math.max(1, 0.1 * cur_fontsize))
    }

    for (let i = 0; i < layers.length; i++) {
        let layerName = layers[i].name;
        let layerID = layers[i].id;
        if (layerName === "Furious 7") {
            let cur = 1
        }

        currentLabel.style("font-size", "30px")
            .attr("id", "currentLabel_" + layerID)
            .text(layerName)

        let final_path, final_FontSize = -1;

        let thisFontSize = 0

        for (let j = 0; j < num_Font_Size.length; j++) {
            thisFontSize = num_Font_Size[j]
            currentLabel.style("font-size", thisFontSize + "px")

            let thisLabel_Length = document.getElementById("currentLabel_" + layerID).getBoundingClientRect().width
            let thisLabel_Height = num_Label_CharHeight[j]

            let usefulPath = runSildeWindow(thisLabel_Length, layers[i].yTop, layers[i].yBottom, layers[i], thisLabel_Height)
            if (usefulPath.length > 0) {

                final_path = usefulPath;
                final_FontSize = thisFontSize;

                if (draw_Final_Label) {
                    let uesfulLabel = cur_labels_g.append("text")

                    cur_labels_g.selectAll("path")
                        .data([usefulPath])
                        .enter()
                        .append("path")
                        .attr("id", "cur_myLabels_g_" + graphIndex + "_label_path_" + layerID)
                        .style("stroke", "black")
                        .style("stroke-width", 1)
                        .style("fill", "none")
                        .attr("d", LineDrawer)
                    uesfulLabel.append("textPath")
                        .attr("xlink:href", "#" + "cur_myLabels_g_" + graphIndex + "_label_path_" + layerID)
                        .attr("font-size", thisFontSize + "px")
                        .attr("dominant-baseline", "middle")
                        .text(layerName)
                    cur_labels_g.selectAll("path").remove()
                    uesfulLabel.remove()
                }
                // usefulPath = runSildeWindow(thisLabel_Length, layers[i].yTop, layers[i].yBottom, layers[i], thisLabel_Height)

                // xlink:href="#my_path1" font-family="monospace" font-size="60" dominant-baseline="middle"
                break;
            }
        }


        if (final_FontSize === -1) {
            final_path = [new Point_Graph(0, 0, -1)]
            final_FontSize = 0
        }

        let thisLabelData = {};
        thisLabelData.id = layerID;
        thisLabelData.name = layerName;
        thisLabelData.label_path = final_path;
        thisLabelData.fontsize = final_FontSize;


        var color = layers[i].fillcolor;
        var values = color.substring(4, color.length - 1).split(",");
        var red = parseInt(values[0]) / 255;
        var green = parseInt(values[1]) / 255;
        var blue = parseInt(values[2]) / 255;
        var gamma = 2.2;
        var intensity =
            .2126 * Math.pow(red, gamma) +
            .7152 * Math.pow(green, gamma) +
            .0722 * Math.pow(blue, gamma);
        thisLabelData.lableColor = (intensity > 0.3 ? "black" : "white");
        thisLabelData.opacity = (intensity > 0.3 ? 0.5 : 0.7);

        LabelData.push(thisLabelData);

    }
    cur_labels_g.remove()
    return LabelData;


    /**
     * 得到某个字号的label在这个label上对应的所有滑动窗口的数据，这个字号已经通过label_Length体现出来了
     * @param {要放置的label在图上的宽度} label_Length 
     * @param {这个layer的yTopyBaseline数组} yT 
     * @param 这个layer的yBottomyBaseline数组 yB 
     * @param {这个label可以接受的弯曲角度} angle,所有的角度都是从右侧逆时针旋转的
     */
    function runSildeWindow(label_Length, yT, yB, thisLayer, height_graph) {

        let drawFittingLine_BoundaryPoints = false

        let drawUsefulFittingLine = false

        let label_Diagonal = Math.sqrt(label_Length * label_Length + height_graph * height_graph)


        let result_windows = []//最终的结果

        let fitting_Line_Length = label_Length
        // let fitting_Line_Length = label_Length

        let start_Window_Index = undefined,
            end_Window_Index = undefined;

        //如果这个layer没有长度的话，直接返回
        if (thisLayer.onset === -1) {
            return result_windows
        }

        for (let i = thisLayer.onset; i < yT.length; i++) {
            if (yT[i].x - yT[thisLayer.onset].x >= fitting_Line_Length / 2) {
                start_Window_Index = i;
                break;
            }
        }

        for (let i = thisLayer.end; i >= 0; i--) {
            if (yT[thisLayer.end].x - yT[i].x >= fitting_Line_Length / 2) {
                end_Window_Index = i;
                break;
            }
        }
        //如果这个layer的全部长度都放不下这个label，返回
        if (start_Window_Index === undefined || end_Window_Index === undefined) {
            return result_windows
        }


        let useful_windows = []
        let topBoundary = []
        let bottomBoundary = []
        for (let i = start_Window_Index; i <= end_Window_Index; i++) {

            //首先得到这个滑动窗口对应的上下边界
            topBoundary.splice(0)
            bottomBoundary.splice(0)

            //左边界点
            let left_EndPoint_Index = currentLinearX.invert(yT[i].x - fitting_Line_Length / 2);
            if (Math.abs(left_EndPoint_Index - Math.round(left_EndPoint_Index)) > 0.05) {
                let left_EndPoint_T = new Point_Graph(yT[i].x - fitting_Line_Length / 2, getYvalue_by_Index(yT, left_EndPoint_Index), left_EndPoint_Index)
                let left_EndPoint_B = new Point_Graph(yT[i].x - fitting_Line_Length / 2, getYvalue_by_Index(yB, left_EndPoint_Index), left_EndPoint_Index)
                topBoundary.push(left_EndPoint_T)
                bottomBoundary.push(left_EndPoint_B)
                left_EndPoint_Index = Math.ceil(left_EndPoint_Index)
            } else {
                left_EndPoint_Index = Math.round(left_EndPoint_Index);
            }
            //右边界点
            let right_EndPoint_Index = currentLinearX.invert(yT[i].x + fitting_Line_Length / 2);
            if (Math.abs(right_EndPoint_Index - Math.round(right_EndPoint_Index)) > 0.05) {
                let right_EndPoint_T = new Point_Graph(yT[i].x + fitting_Line_Length / 2, getYvalue_by_Index(yT, right_EndPoint_Index), right_EndPoint_Index)
                let right_EndPoint_B = new Point_Graph(yT[i].x + fitting_Line_Length / 2, getYvalue_by_Index(yB, right_EndPoint_Index), right_EndPoint_Index)
                topBoundary.push(right_EndPoint_T)
                bottomBoundary.push(right_EndPoint_B)
                right_EndPoint_Index = Math.floor(right_EndPoint_Index)
            } else {
                right_EndPoint_Index = Math.round(right_EndPoint_Index);
            }
            //将左右界点之间的边界上的点加入进去
            for (let j = left_EndPoint_Index; j <= right_EndPoint_Index; j++) {
                topBoundary.push(yT[j])
                bottomBoundary.push(yB[j])
            }

            let All_Boundary_Points = A_Copy_Of(topBoundary).concat(A_Copy_Of(bottomBoundary));

            // 排序是为了方便调试
            // All_Boundary_Points.sort((a, b) => a.x - b.x)
            // topBoundary.sort((a, b) => a.x - b.x)
            // bottomBoundary.sort((a, b) => a.x - b.x)

            //这里是求上下边界点的最小二乘,进行一维拟合
            let [fitting_Line_K, fitting_Line_B] = getLeastSquareMethod(All_Boundary_Points)

            //k是拟合线的正切，现在求得拟合线的余弦
            let fitting_Line_Angle = Math.atan(fitting_Line_K);
            // let fitting_Line_Angle_Cos = Math.cos(fitting_Line_Angle);
            let fitting_Line_Angle_Cos_Abs = Math.abs(Math.cos(fitting_Line_Angle));

            let fitting_Line = []
            fitting_Line.k = fitting_Line_K
            fitting_Line.b = fitting_Line_B
            fitting_Line.angle = fitting_Line_Angle

            //首先添加起点
            fitting_Line.push(new Point_Graph(currentLinearX(i) - fitting_Line_Angle_Cos_Abs * (label_Length / 2),
                fitting_Line_K * (currentLinearX(i) - fitting_Line_Angle_Cos_Abs * (label_Length / 2)) + fitting_Line_B,
                currentLinearX.invert(currentLinearX(i) - fitting_Line_Angle_Cos_Abs * (label_Length / 2))))
            //然后添加终点，然后就得到我们此时此刻label的path了！
            fitting_Line.push(new Point_Graph(currentLinearX(i) + fitting_Line_Angle_Cos_Abs * (label_Length / 2),
                fitting_Line_K * (currentLinearX(i) + fitting_Line_Angle_Cos_Abs * (label_Length / 2)) + fitting_Line_B,
                currentLinearX.invert(currentLinearX(i) + fitting_Line_Angle_Cos_Abs * (label_Length / 2))))

            let cur_point_g, cur_label_line, cur_fitting_line;
            if (drawFittingLine_BoundaryPoints) {//画出此时的label_baseline，对应的上下边界点



                cur_point_g = cur_labels_g
                    .append("g")
                    .attr("name", "拟合线对应的上下边界点")

                cur_label_line = cur_labels_g.append("line")
                    .attr("x1", yT[i].x - fitting_Line_Length / 2)
                    .attr("y1", yT[i].y / 2 + yB[i].y / 2)
                    .attr("x2", yT[i].x + fitting_Line_Length / 2)
                    .attr("y2", yT[i].y / 2 + yB[i].y / 2)
                    .attr("stroke", "black")
                    .attr("stroke-width", 0)

                cur_point_g.selectAll("circle")
                    .data(All_Boundary_Points)
                    .enter()
                    .append("circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", 2)
                    .style("fill", "black")
                cur_fitting_line = cur_labels_g.append("line")
                    .attr("x1", fitting_Line[0].x)
                    .attr("y1", fitting_Line[0].y)
                    .attr("x2", fitting_Line[1].x)
                    .attr("y2", fitting_Line[1].y)
                    .attr("stroke", "red")
                    .attr("stroke-width", 2)
                // cur_point_g.remove()
                // cur_line.remove()
            }


            //去除无效的窗口，也就是baseline不在layer中间的baseline
            let isLegal_curWindow = true;
            for (let j = fitting_Line[0].index; j < Math.ceil(fitting_Line[1].index);) {
                let thisyTop = getYvalue_by_Index(yT, j);//图上yTop在上面，但是Y坐标在下面
                let thisyBottom = getYvalue_by_Index(yB, j);//图上yBottom在下面，但是数据上yBottom在上面
                let thisYLabel = fitting_Line_K * currentLinearX(j) + fitting_Line_B
                if (thisYLabel <= thisyTop || thisYLabel >= thisyBottom) {
                    isLegal_curWindow = false
                    break;
                }
                if (j === fitting_Line[1].index)
                    j++//跳出循环
                else if (isFloat(j))
                    if (Math.ceil(j) < fitting_Line[1].index)
                        j = Math.ceil(j);
                    else
                        j = fitting_Line[1].index;
                else
                    if (j + 1 < fitting_Line[1].index)
                        j++;
                    else
                        j = fitting_Line[1].index;
            }
            if (!isLegal_curWindow) {
                if (drawFittingLine_BoundaryPoints) {
                    cur_label_line.remove()
                    cur_point_g.remove()
                    cur_fitting_line.remove()
                }
                continue
            }

            //好的现在我们已经得到了这个滑动窗口的baseline！接下来要计算这个窗口的baseline是否有效

            let curWindow_vertical_distance = isUseful_Window(fitting_Line, yT, yB, height_graph)
            if (curWindow_vertical_distance[0]) {
                // curWindow_vertical_distance = isUseful_Window(fitting_Line, yT, yB, height_graph)
                useful_windows.push([A_Copy_Of(fitting_Line), A_Copy_Of(curWindow_vertical_distance[1]), A_Copy_Of(curWindow_vertical_distance[2])])
                fitting_Line.splice(0)
            }

            if (drawFittingLine_BoundaryPoints) {
                cur_label_line.remove()
                cur_point_g.remove()
                cur_fitting_line.remove()
            }
        }


        if (useful_windows.length > 0) {
            let cur_line2

            if (drawUsefulFittingLine) {
                cur_labels_g.selectAll("path").remove()
                cur_line2 = cur_labels_g.selectAll("path")
                    .data(useful_windows.map(d => d[0]))
                    .enter()
                    .append("path")
                    .attr("class", "label_line")
                    .attr("d", LineDrawer)
                    .style("stroke", "red")

                cur_line2.remove()
            }

            let distance_yT_sum = 2
            let distance_yB_sum = 0
            let total_distance_mean = 0
            let max_total_distance_mean = -Infinity

            for (let i = 0; i < useful_windows.length; i++) {
                // distance_yT_sum = 0
                // distance_yB_sum = 0
                distance_yT_sum = d3.sum(useful_windows[i][2]);
                distance_yB_sum = d3.sum(useful_windows[i][1]);

                total_distance_mean = (distance_yT_sum + distance_yB_sum) / (useful_windows[i][1].length + useful_windows[i][2].length)

                if (total_distance_mean > max_total_distance_mean) {
                    max_total_distance_mean = total_distance_mean
                    result_windows = useful_windows[i][0]
                }
            }
            return result_windows
        } else {
            return result_windows
        }
    }
    /**
     * 判断一个滑动窗口是否是有效的，因为baseline是一条直线，所以直接求距离就好
     * @param {滑动窗口的baseline} fitting_Line 
     * @param {滑动窗口所在layer的上边界} yT 
     * @param {滑动窗口所在layer的下边界} yB 
     * @param {滑动窗口对应label的高度} height_graph 
     */
    function isUseful_Window(fitting_Line, yT, yB, height_graph) {

        let drawVerticalLines_IntersectPoints = false

        let vertical_lines = []
        let cur_line_g;
        let points = []
        let cur_point_g;

        let left_vertical_b = fitting_Line[0].y + 1 / fitting_Line.k * fitting_Line[0].x
        let right_vertical_b = fitting_Line[1].y + 1 / fitting_Line.k * fitting_Line[1].x
        vertical_lines.push([0, left_vertical_b, width, -1 / fitting_Line.k * width + left_vertical_b])
        vertical_lines.push([0, right_vertical_b, width, -1 / fitting_Line.k * width + right_vertical_b])

        if (drawVerticalLines_IntersectPoints) {
            //画出左右两条垂线
            cur_line_g = cur_labels_g
                .append('g')
                .attr("name", "包含两条垂线")
            cur_line_g.selectAll("line")
                .data(vertical_lines)
                .enter()
                .append("line")
                .attr("x1", d => d[0])
                .attr("y1", d => d[1])
                .attr("x2", d => d[2])
                .attr("y2", d => d[3])
                .attr("stroke", "black")
                .attr("stroke-width", 2)
        }

        let start_index_T = 0
        let start_index_B = 0
        let end_index_T = 0
        let end_index_B = 0

        if (Math.abs(fitting_Line.k) < 0.05) {
            start_index_T = fitting_Line[0].index
            start_index_B = fitting_Line[0].index
            end_index_T = fitting_Line[1].index
            end_index_B = fitting_Line[1].index
            if (drawVerticalLines_IntersectPoints) {//画出此时的label_baseline，对应的上下边界点
                points.push(new Point_Graph(fitting_Line[0].x, getYvalue_by_Index(yT, start_index_T), start_index_T))
                points.push(new Point_Graph(fitting_Line[0].x, getYvalue_by_Index(yB, start_index_B), start_index_B))
                points.push(new Point_Graph(fitting_Line[1].x, getYvalue_by_Index(yT, end_index_T), end_index_T))
                points.push(new Point_Graph(fitting_Line[1].x, getYvalue_by_Index(yB, end_index_B), end_index_B))

                cur_point_g = cur_labels_g
                    .append('g')
                    .attr("name", "label baseline的垂线与上下边界的交点")
                cur_point_g.selectAll("circle")
                    .data(points)
                    .enter()
                    .append("circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", 2)
                    .style("fill", "red")
            }
        } else {
            let fitting_Line_Vertical_K = -1 / fitting_Line.k;
            [start_index_T, start_index_B, end_index_T, end_index_B] = getIntersectPointsIndex_VerticalLine_Boundary(fitting_Line_Vertical_K, fitting_Line, yT, yB);

            if (drawVerticalLines_IntersectPoints) {//画出此时的label_baseline，对应的上下边界点
                points.push(new Point_Graph(currentLinearX(start_index_T), getYvalue_by_Index(yT, start_index_T), start_index_T))
                points.push(new Point_Graph(currentLinearX(start_index_B), getYvalue_by_Index(yB, start_index_B), start_index_B))
                points.push(new Point_Graph(currentLinearX(end_index_T), getYvalue_by_Index(yT, end_index_T), end_index_T))
                points.push(new Point_Graph(currentLinearX(end_index_B), getYvalue_by_Index(yB, end_index_B), end_index_B))

                cur_point_g = cur_labels_g
                    .append('g')
                    .attr("name", "label baseline的垂线与上下边界的交点")
                cur_point_g.selectAll("circle")
                    .data(points)
                    .enter()
                    .append("circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", 2)
                    .style("fill", "red")
            }
        }

        let fitting_Line_Angle_Cos_Abs = Math.abs(Math.cos(fitting_Line.angle))
        let res = [true]
        let res_vertical_distance_B = []
        let res_vertical_distance_T = []
        //接下来开始判断这个label是否有效
        //首先是上边界
        for (let i = start_index_B; i < Math.ceil(end_index_B);) {
            let this_Y_fitting = fitting_Line.k * currentLinearX(i) + fitting_Line.b
            let this_Y_B = getYvalue_by_Index(yB, i)
            let this_vertical_distance = Math.abs(this_Y_fitting - this_Y_B) * fitting_Line_Angle_Cos_Abs
            if (this_vertical_distance < height_graph / 2) {
                res[0] = false
                break
            } else {
                res_vertical_distance_B.push(this_vertical_distance)
            }
            if (i === end_index_B)
                break
            else if (isFloat(i))
                if (Math.ceil(i) > end_index_B)
                    i = end_index_B
                else
                    i = Math.ceil(i)
            else
                if (i + 1 > end_index_B)
                    i = end_index_B
                else
                    i += 1
        }
        //然后是下边界
        if (res[0]) {
            for (let i = start_index_T; i < Math.ceil(end_index_T);) {
                let this_Y_fitting = fitting_Line.k * currentLinearX(i) + fitting_Line.b
                let this_Y_T = getYvalue_by_Index(yT, i)
                let this_vertical_distance = Math.abs(this_Y_fitting - this_Y_T) * fitting_Line_Angle_Cos_Abs
                if (this_vertical_distance < height_graph / 2) {
                    res[0] = false
                    break
                } else {
                    res_vertical_distance_T.push(this_vertical_distance)
                }
                if (i === end_index_T)
                    break
                else if (isFloat(i))
                    if (Math.ceil(i) > end_index_T)
                        i = end_index_T
                    else
                        i = Math.ceil(i)
                else
                    if (i + 1 > end_index_T)
                        i = end_index_T
                    else
                        i += 1
            }
        }

        if (drawVerticalLines_IntersectPoints) {
            cur_line_g.remove()
            cur_point_g.remove()
        }

        res.push(res_vertical_distance_B)
        res.push(res_vertical_distance_T)

        return res



    }



    /**
     * 
     * @param {label的baseline的垂线的斜率} fitting_Line_Vertical_K 
     * @param {label的baseline，是一条拟合出来的线} fitting_Line 
     * @param {label所在layer的下边界} yT 
     * @param {label所在layer的上边界} yB 
     */
    function getIntersectPointsIndex_VerticalLine_Boundary(fitting_Line_Vertical_K, fitting_Line, yT, yB) {
        //四个变量对应的
        let sB = undefined, sT = undefined, eB = undefined, eT = undefined;
        let i = undefined;
        let pre_i = undefined
        let pre_Y_fitting = undefined;
        let pre_Y_B = undefined;
        let pre_Y_T = undefined;
        let change_Index = undefined;
        let start_Index = undefined;
        let end_Index = undefined;

        //首先求上边界的交点，也就是yBottom
        if (fitting_Line_Vertical_K > 0) {
            change_Index = 1;
            start_Index = Math.ceil(fitting_Line[0].index);
            end_Index = Math.ceil(fitting_Line[1].index);
        } else {
            change_Index = -1;
            start_Index = Math.floor(fitting_Line[0].index);
            end_Index = Math.floor(fitting_Line[1].index);
        }
        //先求label起点对应的上边界起点
        pre_i = fitting_Line[0].index;
        pre_Y_fitting = fitting_Line[0].y;
        pre_Y_B = getYvalue_by_Index(yB, fitting_Line[0].index)
        i = start_Index;
        for (; i < yB.length && i >= 0; i += change_Index) {
            let this_Y_fitting = pre_Y_fitting + Math.abs(fitting_Line_Vertical_K * (currentLinearX(i) - currentLinearX(pre_i)));
            let this_Y_B = yB[i].y;
            let a_start = pre_Y_fitting, a_end = this_Y_fitting;
            let b_start = Math.min(pre_Y_B, this_Y_B), b_end = Math.max(pre_Y_B, this_Y_B);
            if (Math.max(a_start, b_start) <= Math.min(a_end, b_end)) {
                //这里用了三角形等比定理
                let delta = Math.abs((this_Y_fitting - this_Y_B) / (pre_Y_fitting - pre_Y_B))
                let delta_i = (i - pre_i) / (1 + delta) * delta
                sB = i - delta_i
                break
            } else {
                pre_Y_fitting = this_Y_fitting
                pre_Y_B = this_Y_B
                pre_i = i;
                continue
            }
        }
        if (sB === undefined) {
            sb = i - change_Index
        }
        //再求label起点对应的上边界终点
        pre_i = fitting_Line[1].index
        pre_Y_fitting = fitting_Line[1].y;
        pre_Y_B = getYvalue_by_Index(yB, fitting_Line[1].index)
        i = end_Index
        for (; i < yB.length && i >= 0; i += change_Index) {
            let this_Y_fitting = pre_Y_fitting + Math.abs(fitting_Line_Vertical_K * (currentLinearX(i) - currentLinearX(pre_i)));
            let this_Y_B = yB[i].y;
            let a_start = pre_Y_fitting, a_end = this_Y_fitting;
            let b_start = Math.min(pre_Y_B, this_Y_B), b_end = Math.max(pre_Y_B, this_Y_B);
            if (Math.max(a_start, b_start) <= Math.min(a_end, b_end)) {
                //这里用了三角形等比定理
                let delta = Math.abs((this_Y_fitting - this_Y_B) / (pre_Y_fitting - pre_Y_B))
                let delta_i = (i - pre_i) / (1 + delta) * delta
                eB = i - delta_i
                break
            } else {
                pre_Y_fitting = this_Y_fitting
                pre_Y_B = this_Y_B
                pre_i = i;
                continue
            }
        }
        if (eB === undefined) {
            eB = i - change_Index
        }

        //////////////////////////////////////////////////////////////////////////////

        //然后求下边界的交点，也就是yTop
        if (fitting_Line_Vertical_K > 0) {
            change_Index = -1;
            start_Index = Math.floor(fitting_Line[0].index);
            end_Index = Math.floor(fitting_Line[1].index);
        } else {
            change_Index = 1;
            start_Index = Math.ceil(fitting_Line[0].index);
            end_Index = Math.ceil(fitting_Line[1].index);
        }
        //先求label起点对应的下边界起点
        pre_i = fitting_Line[0].index
        pre_Y_fitting = fitting_Line[0].y;
        pre_Y_T = getYvalue_by_Index(yT, fitting_Line[0].index)
        i = start_Index
        for (; i < yT.length && i >= 0; i += change_Index) {
            let this_Y_fitting = pre_Y_fitting - Math.abs(fitting_Line_Vertical_K * (currentLinearX(i) - currentLinearX(pre_i)));
            let this_Y_T = yT[i].y;
            let a_start = this_Y_fitting, a_end = pre_Y_fitting;
            let b_start = Math.min(pre_Y_T, this_Y_T), b_end = Math.max(pre_Y_T, this_Y_T);
            if (Math.max(a_start, b_start) <= Math.min(a_end, b_end)) {
                //这里用了三角形等比定理
                let delta = Math.abs((this_Y_fitting - this_Y_T) / (pre_Y_fitting - pre_Y_T))
                let delta_i = (i - pre_i) / (1 + delta) * delta
                sT = i - delta_i
                break
            } else {
                pre_Y_fitting = this_Y_fitting
                pre_Y_T = this_Y_T
                pre_i = i;
                continue
            }
        }
        if (sT === undefined) {
            sT = i - change_Index
        }
        //再求label起点对应的下边界终点
        pre_i = fitting_Line[1].index
        pre_Y_fitting = fitting_Line[1].y;
        pre_Y_T = getYvalue_by_Index(yT, fitting_Line[1].index)
        i = end_Index
        for (; i < yT.length && i >= 0; i += change_Index) {
            let this_Y_fitting = pre_Y_fitting - Math.abs(fitting_Line_Vertical_K * (currentLinearX(i) - currentLinearX(pre_i)));
            let this_Y_T = yT[i].y;
            let a_start = this_Y_fitting, a_end = pre_Y_fitting;
            let b_start = Math.min(this_Y_T, pre_Y_T), b_end = Math.max(this_Y_T, pre_Y_T);
            if (Math.max(a_start, b_start) <= Math.min(a_end, b_end)) {
                //这里用了三角形等比定理
                let delta = Math.abs((this_Y_fitting - this_Y_T) / (pre_Y_fitting - pre_Y_T))
                let delta_i = (i - pre_i) / (1 + delta) * delta
                eT = i - delta_i
                break
            } else {
                pre_Y_fitting = this_Y_fitting
                pre_Y_T = this_Y_T
                pre_i = i;
                continue
            }
        }
        if (eT === undefined) {
            eT = i - change_Index
        }
        return [sT, sB, eT, eB]

    }


    /**
     * 根据index获得对应的Y_graph值
     * @param {点坐标数组,存储着x,y,index }num
     * @param {索引,不一定是整数} index 
     */
    function getYvalue_by_Index(num, index) {
        if (index < 0 || index > num.length - 1) {
            throw "getYvalue_by_Index 索引错误: " + index
        }
        for (let i = 0; i < num.length; i++) {
            if (num[i].index > index) {
                let k = (index - num[i - 1].index) / (num[i].index - num[i - 1].index)
                return num[i - 1].y + k * ((num[i].y - num[i - 1].y))
            }
        }
    }

    /**
     * 根据x坐标获得对应的Y_graph值
     * @param {点坐标数组,存储着x,y,index }num
     * @param {这个点的x坐标} x
     */
    function getYvalue_by_X(num, x) {
        if (index < 0 || index > width) {
            throw "getYvalue_by_X 索引错误: " + x
        }
        for (let i = 0; i < num.length; i++) {
            if (num[i].x > x) {
                let k = (x - num[i - 1].x) / (num[i].x - num[i - 1].x)
                return num[i - 1].y + k * ((num[i].y - num[i - 1].y))
            }
        }
    }



    /**
    * 判断输入的值是不是float类型
    * @param {输入一个值} n 
    */
    function isFloat(n) {
        return n + ".0" != n;
    }


    /**
     * 返回一个对象的副本
     * @param {要进行复制的对象} ele 
     */
    function A_Copy_Of(ele) {
        return JSON.parse(JSON.stringify(ele))
    }

}

/**
 * 最小二乘法得到线
 * @param {点数组} data 
 * 感谢李晓桐学姐的支持^_^
 */
export function getLeastSquareMethod(data) {
    let len = data.length;
    let meanX = 0;
    let sumOfSquerdX = 0;
    let sumOfX = 0;
    let meanY = 0;
    let sumOfY = 0;
    for (let i = 0; i < len; i++) {
        sumOfX += data[i].x;
        sumOfY += data[i].y;
        sumOfSquerdX += data[i].x * data[i].x;
    }
    meanX = sumOfX / len;
    meanY = sumOfY / len;
    // sum of (yi*(xi-meanX))
    let denominatorOfK = 0;
    for (let i = 0; i < len; i++) {
        denominatorOfK += data[i].y * (data[i].x - meanX);
    }
    let K = denominatorOfK / (sumOfSquerdX - sumOfX * sumOfX / len);
    let B = 0;
    let paramOfB = 0;
    for (let i = 0; i < len; i++) {
        paramOfB += data[i].y - K * data[i].x;
    }
    B = paramOfB / len;

    return [K, B];
}


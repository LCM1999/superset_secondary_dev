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
import * as d3 from 'd3597'

import {StreamLayout_2norm_Gauss,
    getC_2norm_Gauss,
    getDeltaG_2norm_Gauss,
    HierarchicalClusteringOrder,
    getDistance_LayerNode,
    getOrder_HierarchicalClustering,
    getAllLeaves_InternalNode,
    sortHierarchicalClusteringTree,
    getLeftMostLeave_InternalNode,
    LayerNode,//这是一类
} from './Layout_Ours'



// 获得某个层在某个时间点的厚度
export function getSize(layers, layerIndex, time) {
    if (layerIndex < layers.length && time < layers[0].size.length && layerIndex >= 0 && time >= 0) {
        if (layers[layerIndex].size[time] < 0.000001) {
            return 0;
        }
        return layers[layerIndex].size[time];
    } else {
        return 0;
    }
}

/*
函数:根据确定的baseline和order，得到布局数据
参数:
备注:
*/
export function stackOnBaseline(layers, baseline) {
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        layer.yBottom = baseline.slice(0);
        for (var j = 0; j < baseline.length; j++)
            // baseline[j] -= layer.size[j];
            baseline[j] += layer.size[j];
        layer.yTop = baseline.slice(0);
    }
    // console.log(layers);
    return layers;
}

//打印当前排序结果
export function printLabels(layers, toprint = true) {
    let labels = [];
    for (let i = 0; i < layers.length; i++) {
        labels.push(layers[i].name);
    }
    if (toprint)
        console.log(labels);
    return labels;
}

//判断是否与EuroVis排序结果相同
export function equalToEuroVis(curlabels, Labels) {
    // console.log(curlabels);
    // console.log(Labels);

    let cur = true;
    for (let i = 0; i < curlabels.length; i++) {
        if (curlabels[i] !== Labels[i]) {
            cur = false;
            break;
        }
    }
    if (!cur) {
        curlabels.reverse();
        for (let i = 0; i < curlabels.length; i++) {
            if (curlabels[i] !== Labels[i]) {
                cur = false;
                break;
            }
        }
    }
    console.log("是否与EuroVis默认排序结果相同: " + cur);
    return cur;
}

/*
函数:得到当前streamgraph的最低点和最高点
参数:
备注:
*/
export function getYTop_YBottom(data) {
    let curYBottom = Infinity;
    let curYTop = -Infinity;
    // console.log(curYBottom);
    // console.log(curYTop);
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            // console.log(data[i][j][1]);
            curYTop = Math.max(curYTop, data[i][j][1]);
            curYBottom = Math.min(curYBottom, data[i][j][0]);
        }

    }
    return [curYBottom, curYTop];
}

//将layers数据转化为D3模板的数据
export function getLayersData(Layers) {
    let data = []
    let YBottom = Infinity,
        YTop = -Infinity;
    for (let i = 0; i < Layers.length; i++) {
        data.push([]);
    }
    for (let i = 0; i < Layers.length; i++) {
        // data[i].initialName = Layers[i].initialName
        data[i].name = Layers[i].name;
        data[i].id = Layers[i].id;
        data[i].fillcolor = Layers[i].fillcolor;
        for (let j = 0; j < Layers[i].size.length; j++) {
            data[i].push([Layers[i].yBottom[j], Layers[i].yTop[j]])
            data[i][j].time = j;
            YBottom = Math.min(YBottom, Layers[i].yBottom[j])
            YTop = Math.max(YTop, Layers[i].yTop[j])
        }
    }
    // console.log("得到画图数据");
    // console.log(data);

    //顺势更新一波Y轴坐标
    updateLinearY(YBottom, YTop)

    return data;
}

/*
函数:将图像转化为堆叠图
参数:
备注:
*/
export function changeToStackedGraph(layers) {
    let curBaseLine = [];
    for (let i = 0; i < layers[0].size.length; i++) {
        curBaseLine.push(0);
    }
    layers = stackOnBaseline(layers, curBaseLine);
    return layers;
}

/*
函数:用来相应按钮事件的方法，用来调用changeToStackedGraph方法
参数:
备注:
*/
export function toStackedGraph() {
    d3.selectAll("button")
        .style("background", "white")
    d3.select("#BtnStacked")
        .style("background", "red")
    changeToStackedGraph(Layers);
    let layersData = getLayersData(Layers)

    // console.log(layersData);

    drawStreamGraph(layersData, maxTotalSize)
}

/*
函数:获得所有时间段最厚的
参数:
备注:
*/
export function getMaxTotalSize(Layers) {
    let maxTotalSize = 0;
    for (let i = 0; i < Layers[0].size.length; i++) {
        let curSize = 0;
        for (let j = 0; j < Layers.length; j++) {
            curSize += Layers[j].size[i];
        }
        maxTotalSize = Math.max(maxTotalSize, curSize);
    }
    return maxTotalSize;
}

/*
函数:更新Y坐标轴
参数:
备注:
*/
export function updateLinearY(curYBottom, curYTop) {
        let linearY = d3.scaleLinear()
        //.domain([curYBottom, curYTop])
        //.domain([-2.2, 2.2])
        .domain([curYBottom * 1.1, curYTop * 1.1])
        .range([height, 0]);
        //.range([height, height - height/4*(curYTop-curYBottom)]);
}

/*
函数:无排序方法
参数:
备注:
*/
export function UnOrder(layers) {
    return layers;
}
/**
 * 所有layer全部选中
 */
export function selectAllLayers() {
    for (let i = 0; i < initialLayers.length; i++) {
        document.getElementById("layerSelector_" + initialLayers[i].id).checked = true;
    }
}

/**
 * 所有layer全部不选中
 */
export function selectNoneLayers() {
    for (let i = 0; i < initialLayers.length; i++) {
        document.getElementById("layerSelector_" + initialLayers[i].id).checked = false;
    }
}

/**
 * 反选所有选中的layer
 */
export function reverseSelectedLayers() {
    for (let i = 0; i < initialLayers.length; i++) {
        document.getElementById("layerSelector_" + initialLayers[i].id).checked = !document.getElementById("layerSelector_" + initialLayers[i].id).checked;
    }
}

/**
 * 对streamgraph的可读性进行量化
 * @param {布局好的layers} layers 
 */
export function quantifyReadability(layers, baselineType = "ours_") {

    let res = getTotalWiggle(layers, baselineType.replace("_", ""))

    return res
}


/*
函数:计算一个streamgraph图中选定layers在时间startT到endT之间的wiggle总和
参数:
    curLayers选定的layer，
    startT开始时间，
    endT结束时间,
    wiggleFunction计算wiggle的函数
备注:
    实际计算的时间是从startT到endT-1这段时间里的
*/
export function getTotalWiggle(curLayers, getWiggleFunctionType = "1norm_", cType = "median", startIndex = 0, endIndex = curLayers.length, startT = 0, endT = curLayers.length > 0 ? curLayers[0].size.length : 0) {

    /*
函数:计算EuroVis的wiggle的方法
参数:
    curLayer要进行计算的layer
    timePoint要进行计算的时间点
备注:
*/
    function caluWiggle_EuroVis(curLayer, timePoint) {
        if (timePoint === 0) {
            return 0
        } else if (curLayer === undefined) {
            console.log("ERROR:::Function:caluWiggle_EuroVis para: curLayer is undefined");
            return
        } else {
            return curLayer.size[timePoint] * (Math.abs(curLayer.yBottom[timePoint] - curLayer.yBottom[timePoint - 1]) + Math.abs(curLayer.yTop[timePoint] - curLayer.yTop[timePoint - 1])) / 2;
        }
    }
    /*
    函数:计算08文章的wiggle的方法
    参数:
        curLayer要进行计算的layer
        timePoint要进行计算的时间点
    备注:
    */
    function getWiggle_2norm(curLayer, timePoint) {
        if (timePoint === 0) {
            return 0
        } else if (curLayer === undefined) {
            console.log("ERROR:::Function:caluWiggle_EuroVis para: curLayer is undefined");
            return
        } else {
            return curLayer.size[timePoint] * Math.pow((curLayer.yBottom[timePoint] - curLayer.yBottom[timePoint - 1] + curLayer.yTop[timePoint] - curLayer.yTop[timePoint - 1]) / 2, 2);
        }
    }

    /*
    函数:计算新公式的wiggle公式的方法
    参数:curLayer要进行计算的layer
        timePoint要进行计算的时间点
    备注:
    */
    function caluWiggle_2norm_Gauss(curLayer, timePoint, c) {
        if (timePoint === 0) {
            return 0
        } else if (curLayer === undefined) {
            console.log("ERROR:::Function:caluWiggle_2norm_Gauss para: curLayer is undefined");
            return;
        } else {
            let gaussPara = c === 0 ? 1 : Math.pow(Math.E, (0 - ((Math.pow((curLayer.size[timePoint] - curLayer.size[timePoint - 1]), 2)) / (2 * c * c))))
            return gaussPara * curLayer.size[timePoint] * Math.pow((curLayer.yBottom[timePoint] - curLayer.yBottom[timePoint - 1] + curLayer.yTop[timePoint] - curLayer.yTop[timePoint - 1]) / 2, 2);
        }
    }

    /*
    函数:计算新公式的wiggle公式的方法
    参数:curLayer要进行计算的layer
        timePoint要进行计算的时间点
    备注:
    */
    function caluWiggle_Slope_Sum(curLayer, timePoint) {
        if (timePoint === 0) {
            return 0
        } else if (curLayer === undefined) {
            console.log("ERROR:::Function:caluWiggle_Slope_Sum para: curLayer is undefined");
            return;
        } else {
            // return curLayer.size[timePoint] === 0 ? 0 : Math.abs((curLayer.yBottom[timePoint] + curLayer.yTop[timePoint]) / 2 -
            //     (curLayer.yBottom[timePoint - 1] + curLayer.yTop[timePoint - 1]) / 2)
            return curLayer.size[timePoint] === 0 ? 0 :  Math.abs(
                (curLayer.yBottom[timePoint] - curLayer.yBottom[timePoint - 1]) *
                (curLayer.yTop[timePoint] + curLayer.yTop[timePoint - 1])
            )
        }
    }


    let totalWiggle = 0;
    let getWiggleFunction;
    switch (getWiggleFunctionType.toLowerCase()) {
        case "1norm":
            getWiggleFunction = caluWiggle_EuroVis;
            break
        case "2norm":
            getWiggleFunction = getWiggle_2norm;
            break
        case "slope sum":
            getWiggleFunction = caluWiggle_Slope_Sum;
            break
        case "ours":
            getWiggleFunction = caluWiggle_2norm_Gauss;
            break
        default:
            getWiggleFunction = caluWiggle_EuroVis;
            break
    }

    for (let i = startT; i < endT; i++) {
        if (i === 0) {
            continue;
        }
        let thisTimePointWiggle = 0;
        for (let j = startIndex; j < endIndex; j++) {
            if (getWiggleFunctionType.toLowerCase() === "ours") {
                let c = getC_2norm_Gauss(curLayers, i, cType);
                thisTimePointWiggle += getWiggleFunction(curLayers[j], i, c);
            } else {
                thisTimePointWiggle += getWiggleFunction(curLayers[j], i);
            }
        }
        totalWiggle += thisTimePointWiggle;
    }
    // return normalizeWiggleResut(totalWiggle);
    // return (totalWiggle / 1000000).toFixed(2);
    return totalWiggle;
}

/*
函数:将wiggle计算结果进行normalized
参数:
备注:
*/
export function normalizeWiggleResut(cur) {
    while (cur > 1000) {
        cur /= 10;
    }
    return cur.toFixed(2)
}
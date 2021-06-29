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

import {getSize,
    stackOnBaseline,
    printLabels,
    equalToEuroVis,
    getYTop_YBottom,
    getLayersData,
    changeToStackedGraph,
    toStackedGraph,
    getMaxTotalSize,
    updateLinearY,
    UnOrder,
    selectAllLayers,
    selectNoneLayers,
    reverseSelectedLayers,
    quantifyReadability,
    getTotalWiggle,
    normalizeWiggleResut,
} from './Util_getData'
/*
这里实现的是EuroVis里面提到的算法
 */
export function StreamLayout_EuroVis(layers) {
    let baseline = [];
    for (let i = 0; i < layers[0].size.length; i++) { //遍历所有时间
        // console.log("遍历所有时间");

        let totalSize = 0;
        for (let j = 0; j < layers.length; j++) {
            totalSize += layers[j].size[i];
        }
        if (i === 0) {
            baseline.push(-totalSize / 2);
            continue;
        }
        let dFi = [];
        let Pi = [];
        let Wi = [];
        let Weight = [];
        let deltaG = 0;
        // console.log(layers);

        //计算dFi[]
        for (let j = 0; j < layers.length; j++) {
            let cur1 = getSize(layers, j, i);
            let cur2 = getSize(layers, j, i - 1);
            dFi.push(cur1 - cur2)
        }
        // console.log(dFi);
        //计算Pi[],注意layer是从1开始的，没有第0层layer，一定要注意！！！Pi里面是0，dF1,dF1+dF2,dF1+dF2+dF3,```
        //计算Pi[],注意layer是从1开始的，没有第0层layer，一定要注意！！！Pi里面是0，dF0,dF0+dF1,dF0+dF1+dF2,```
        for (let j = 0; j <= layers.length; j++) {
            if (j === 0) {
                Pi.push(0);
                continue;
            }
            Pi.push(Pi[j - 1] + dFi[j - 1]);
        }
        Pi = Pi.map(function (a) {
            return -a;
        })
        // console.log(Pi);
        //计算Wi[].仍要记得注意layer是从1开始的，没有第0层layer(虽然数据存储是从0开始的)。而边界是从0开始的。
        for (let j = 0; j <= layers.length; j++) {
            let numerator = 0; //分子
            let denominator = 0; //分母
            let curWi = 0;
            //计算Fi/|dFi|
            let k = j - 1;
            if (k >= 0) {
                numerator = getSize(layers, k, i);
                denominator = 2;
                curWi += (numerator / denominator);
            }
            //计算Fi+1/|dFi+1|
            k = j;
            if (k < layers.length) {
                numerator = getSize(layers, k, i);
                denominator = 2;
                curWi += (numerator / denominator);
            }
            Wi.push(curWi);
        }
        // console.log(Wi);
        //得到{[Wi,Pi]}数组,i表示边界，是从0-n的，有n+1个
        for (let j = 0; j <= layers.length; j++) {
            Weight.push([Wi[j], Pi[j]]);
        }
        // console.log(Weight);
        deltaG = getDeltaG(Weight);
        baseline.push(baseline[i - 1] + deltaG)
    }
    console.log(baseline);

    layers = stackOnBaseline(layers, baseline);
    return layers;
}

//根据获得Go'的值
function getDeltaG(weight) {
    weight.sort(function (a, b) {
        return a[1] - b[1]
        // return b[1] - a[1]
    });
    // console.log(weight);
    let formerD = 0;
    for (let i = 0; i < weight.length; i++) {
        formerD += (-weight[i][0]);
    }
    let thisD = 0
    let i = 0;
    let result_i = undefined;
    for (i = 0; i < weight.length; i++) {
        thisD = formerD + 2 * weight[i][0];
        formerD = thisD;
        if (thisD >= 0) {
            // console.log(thisD);
            // console.log(formerD - 2*weight[i][0]);
            result_i = i;
            break;
        }
    }
    let result = 0;
    // result = (weight[i - 1][0] * weight[i - 1][1] + weight[i][0] * weight[i][1]) / (weight[i - 1][0] + weight[i][0])
    // result = (weight[i - 1][0] * weight[i - 1][1] + weight[i+1][0] * weight[i+1][1]) / (weight[i - 1][0] + weight[i+1][0])
    // result = weight[i][0] * weight[i][1]/2;
    result = weight[result_i][1];
    return result;
}


/*  
    实现EuroVis的排序算法，分为两部分
        首先根据bestSort生成初始排序，
        然后根据初始排序，进行TwoOpt排序
*/
//bessor算法
function BestFirstSort_EuroVis(layers) {
    console.log("进入bestSort");
    layers = JSON.parse(JSON.stringify(layers));
    layers = shuffle(layers);
    //长度为1直接返回
    if (layers.length === 1) {
        return;
    }

    let n = layers[0].size.length;
    let newLayers = [];
    let remainedLayers = JSON.parse(JSON.stringify(layers));

    let curTopBaseLine = getArray(n, 0);
    let curBottomBaseLine = getArray(n, 0);

    let topList = [];
    let botList = [];

    while (remainedLayers.length > 0) {
        let toTopOrBot = undefined;
        let curMinWiggle = Infinity;
        let selectedLayer = undefined;
        for (let i = 0; i < remainedLayers.length; i++) {
            let curTop = 0;
            //首先尝试toplist
            curTop = getWiggleOnOneLayer_TwoOpt(curTopBaseLine, remainedLayers[i])
            if (curTop < curMinWiggle) {
                curMinWiggle = curTop;
                toTopOrBot = 'top';
                selectedLayer = i;
            }
            //然后尝试botlist
            let curBot = 0
            curBot = getWiggleOnOneLayer_TwoOpt(curBottomBaseLine, remainedLayers[i])
            if (curBot < curMinWiggle) {
                curMinWiggle = curBot;
                toTopOrBot = 'bot';
                selectedLayer = i;
            }
            // else if (curBot === curTop && curBot === curMinWiggle) {
            //     if (topList.length > botList.length) {
            //         curMinWiggle = curBot;
            //         toTopOrBot = 'bot';
            //         selectedLayer = i;
            //     }
            // }
        }
        let baselineToUpdate = (toTopOrBot === 'top' ? curTopBaseLine : curBottomBaseLine);

        for (let j = 0; j < n; j++) {
            baselineToUpdate[j] += remainedLayers[selectedLayer].size[j];
        }

        let listToUpdate = (toTopOrBot === 'top' ? topList : botList);
        listToUpdate.push(remainedLayers[selectedLayer]);

        remainedLayers.splice(selectedLayer, 1); //删除插入的layer
    }

    //获得新的order排序layers   
    for (let i = 0; i < topList.length; i++) {
        newLayers.unshift(topList[i])
    }
    for (let i = 0; i < botList.length; i++) {
        newLayers.push(botList[i])
    }
    let middleLayer = topList.length - 1;

    console.log("bestSort：得到初始排序");
    console.log(topList);
    console.log(botList);
    // equalToEuroVis(printLabels(newLayers), Labels);
    newLayers.reverse()
    newLayers.middleLayer = newLayers.length - topList.length - 1
    return newLayers
}

//在bestsort算法中，计算将每个layer加入toplist或者bottomlist时，产生的wiggle数值
//因为这里计算的是单层的wiggle，并且有baseline变量，所以也可以用在TwoOpt算法中，逐层计算叠加总wiggle
function getWiggleOnOneLayer_TwoOpt(baseline, layer,wiggle='2norm') {
    let curWiggle = 0;

    // console.log("进入getWiggleOnOneLayer_TwoOpt");

    for (let i = 1; i < layer.size.length; i++) { //遍历时间
        let gi_1 = baseline[i] - baseline[i - 1];
        let gi = gi_1 + (layer.size[i] - layer.size[i - 1]);
        // console.log(curWiggle);

        // 
        if(wiggle==='2norm'){
            curWiggle += layer.size[i] * Math.pow((gi_1 + gi) / 2, 2); //2范数计算wiggle
        }else{
            curWiggle += layer.size[i] * (Math.abs(gi_1) + Math.abs(gi)) / 2;//1范数计算wiggle
        }
        if (isNaN(curWiggle)) {
            console.log("hahaha");
            console.log(baseline);
            console.log(layer);
            throw ("hahah")
        }
    }
    return curWiggle;
}



//TwoOpt算法
//middlelayer存储的是toplist的length-1，所以middlelayer就是上半段的起始点
export function TwoOpt_EuroVis(timesScan_EuroVis,timesRepeat_EuroVis,layers, toBestSort = true, wiggle = '2norm') {
    layers = JSON.parse(JSON.stringify(layers));
    let middleLayer = Math.floor(layers.length / 2);
    if (toBestSort) {
        layers = BestFirstSort_EuroVis(layers);
        middleLayer = layers.middleLayer;
    }
    //截止到目前为止，bestFirst的排序结果是一样的
    console.log("进入TwoOpt");
    let MinWiggle = Infinity;
    let bestOrderedLyaers = [];
    // let bestOrderedLyaers =JSON.parse(JSON.stringify(layers));

    timesScan_EuroVis = layers.length;
    // timesRepeat_EuroVis = layers.length;
    timesRepeat_EuroVis = 5;

    //repeat次数
    for (let i = 0; i < timesRepeat_EuroVis; i++) {
        // console.log("timesRepeat_EuroVis: " + i);
        if (i > 0) {
            layers = shuffle(layers);
            // if (layers.length % 2 === 0) {
            //     middleLayer = Math.floor(layers.length / 2 - 1);
            // } else {
            //     middleLayer = Math.floor(layers.length / 2);
            // }
        }
        let swap_times = 0
        //scan次数
        for (let j = 0; j < timesScan_EuroVis; j++) {
            // console.log("timesScan_EuroVis: " + j);

            /*  然后进行下半段的scan。
                需要注意的是，我们可以把下半段水平翻转过来，然后看做k在下面，k+1在上面。
                然后可以对下半段进行和上半段一样的scan操作
            */
            // baseline = getArray(layers[0].size.length);
            // let cur = []
            for (let k = middleLayer + 1; k < layers.length - 1; k++) {
                let cur1 = getWiggleOnTwoLayer_TwoOpt(layers[k], layers[k + 1], wiggle);
                let cur2 = getWiggleOnTwoLayer_TwoOpt(layers[k + 1], layers[k], wiggle);
                if (cur1 > cur2) {
                    [layers[k], layers[k + 1]] = [layers[k + 1], layers[k]]
                    swap_times++
                    // cur.push(k)
                }
                // baseline = baseline.map(function (value, index) {
                //     return value + layers[k].size[index];
                // })
            }
            // console.log(cur);
            // cur = []


            //首先进行上半段的scan
            // let baseline = getArray(layers[0].size.length);
            for (let k = middleLayer; k > 0; k--) {
                // let cur1 = getWiggleOnTwoLayer_TwoOpt(layers[k], layers[k - 1],baseline);
                // let cur2 = getWiggleOnTwoLayer_TwoOpt(layers[k - 1], layers[k],baseline);
                let cur1 = getWiggleOnTwoLayer_TwoOpt(layers[k], layers[k - 1], wiggle);
                let cur2 = getWiggleOnTwoLayer_TwoOpt(layers[k - 1], layers[k], wiggle);
                if (cur1 > cur2) {
                    [layers[k], layers[k - 1]] = [layers[k - 1], layers[k]]
                    swap_times++
                    // cur.push(k)
                }
                // baseline = baseline.map(function (value, index) {
                //     return value + layers[k].size[index];
                // })
            }
            // console.log(cur);
            if (swap_times === 0) {
                break;
            }
            // equalToEuroVis(printLabels(layers, false), Labels);
        }
        //每次scan结束后，计算当前order的总wiggle。其中把middlelayer的边界设为0
        let curMinWiggle = getWiggleSum_TwoOpt(layers, middleLayer);
        // console.log("当前wiggle： " + curMinWiggle);

        if (curMinWiggle < MinWiggle) {
            MinWiggle = curMinWiggle;
            bestOrderedLyaers = JSON.parse(JSON.stringify(layers));
            // console.log("得到新顺序：");
            // equalToEuroVis(printLabels(layers, false), Labels);

        }
    }
    return bestOrderedLyaers;
}

//在TwoOpt算法中，获得两个layer平铺在平线上产生的wiggle数值
//这里layerA在下面，layerB在上面
function getWiggleOnTwoLayer_TwoOpt(layerA, layerB, wiggle = '2norm') {
    let curWiggle = 0;
    let n = layerA.size.length;
    let g0 = getArray(n, 0);
    // let g0 = baseline;
    let g1 = [0]; //也就是layerA的dfi
    for (let i = 1; i < n; i++) {
        g1.push(layerA.size[i] - layerA.size[i - 1]);
    }
    let g2 = [0]; //也就是layerB的dfi加g1
    for (let i = 1; i < n; i++) {
        g2.push(layerB.size[i] - layerB.size[i - 1] + g1[i]);
    }
    //首先计算layerA的wiggle
    for (let i = 1; i < n; i++) {
        // curWiggle += layerA.size[i] * (Math.abs(g0[i]) + Math.abs(g1[i])) / 2;//1范数计算wiggle
        if (wiggle === '2norm') {
            curWiggle += layerA.size[i] * Math.pow((g0[i] + g1[i]) / 2, 2); //2范数计算wiggle
        } else {
            curWiggle += layerA.size[i] * (Math.abs(g0[i]) + Math.abs(g1[i])) / 2;//1范数计算wiggle
        }
    }
    //然后计算layerB的wiggle
    for (let i = 1; i < n; i++) {
        // curWiggle += layerB.size[i] * (Math.abs(g1[i]) + Math.abs(g2[i])) / 2;//1范数计算wiggle
        // curWiggle += layerB.size[i] * Math.pow((g1[i] + g2[i]) / 2, 2) / 2; //2范数计算wiggle
        //！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
        //！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
        //！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
        //！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
        if (wiggle === '2norm') {
            curWiggle += layerB.size[i] * Math.pow((g1[i] + g2[i]) / 2, 2); //2范数计算wiggle
        } else {
            curWiggle += layerB.size[i] * (Math.abs(g1[i]) + Math.abs(g2[i])) / 2;//1范数计算wiggle
        }
    }
    return curWiggle;
}

//计算当前order的总wiggle，会把middlelayer的边界设为0
function getWiggleSum_TwoOpt(layers, middleLayer, wiggle = '2norm') {
    let n = layers.length;
    let curWiggle = 0;

    let baseline = [];

    //但是根据论文，这里应该是吧middlelayer的边界设置为0
    for (let i = 0; i < layers[0].size.length; i++) {
        baseline.push(0);
    }

    //首先计算上半段的wiggle总值  
    for (let i = middleLayer; i >= 0; i--) {
        curWiggle += getWiggleOnOneLayer_TwoOpt(baseline, layers[i], wiggle);
        for (let j = 0; j < n; j++) {
            baseline[j] += layers[i].size[j];
        }
    }
    //然后计算下半段的wiggle总值
    for (let i = 0; i < layers[0].size.length; i++) {
        baseline[i] = 0;
    }
    for (let i = middleLayer + 1; i < n; i++) {
        curWiggle += getWiggleOnOneLayer_TwoOpt(baseline, layers[i], wiggle);
        for (let j = 0; j < n; j++) {
            baseline[j] += layers[i].size[j];
        }
    }
    return curWiggle;
}



function test(a, b) {
    return (a = b);
}


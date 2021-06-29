//这里实现的算法是Stacked里面那篇论文的算法，以及一些所有的baseline计算方法都会用到的公共方法

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

// Slow on large datasets.这里就是Byron & Wattenberg's Streamgraph论文里的算法
function StreamLayout(layers) {
    var n = layers[0].size.length;
    var m = layers.length;
    var moveUp, increase, belowSize;
    var center = [];
    var baseline = [];

    for (var i = 0; i < n; i++) {
        center[i] = (i === 0) ? 0 : center[i - 1]; // Let the center roll.
        var totalSize = 0;
        for (var j = 0; j < m; j++)
            totalSize += layers[j].size[i];

        // Account for the change of every layer to offset the center point.
        for (var j = 0; j < m; j++) {
            var size = layers[j].size[i];
            if (i === 0) {
                increase = size;
                moveUp = 0.5;
            } else {
                belowSize = 0.5 * size;
                for (var k = j + 1; k < m; k++)
                    belowSize += layers[k].size[i];
                increase = size - layers[j].size[i - 1];
                moveUp = (totalSize == 0) ? 0 : (belowSize / totalSize);
            }

            center[i] += (moveUp - 0.5) * increase;
        }

        // Set baseline to the bottom edge according to the center line
        baseline[i] = center[i] + 0.5 * totalSize;
    }

    layers = stackOnBaseline(layers, baseline);
    return layers;
}

// 这是19.7.18复现的
export function StreamLayout2(layers) {
    var n = layers[0].size.length;
    var m = layers.length;
    var baseline = [];

    let Fi = 0;
    let dFi = 0;
    let dFj = 0;
    for (let i = 0; i < n; i++) {
        let totalSize = 0;
        for (let j = 0; j < m; j++) {
            totalSize += layers[j].size[i];
            // if (i > 0)
            //     totalSize += (layers[j].size[i] + layers[j].size[i - 1]) / 2;
            // else
            //     totalSize += layers[j].size[i]
        }
        if (i == 0) {
            baseline[i] = (0 - totalSize * 0.5);
            // baseline[i] =0;
            continue;
        }
        let deltaG = 0;

        let curDeltaG = 0;
        for (let j = 0; j < m; j++) { // <>//
            curDeltaG = 0;
            dFi = (getSize(layers, j, i) - getSize(layers, j, i - 1));
            curDeltaG += (0.5 * dFi);

            for (let k = 0; k <= j - 1; k++) {
                dFj = (getSize(layers, k, i) - getSize(layers, k, i - 1));
                curDeltaG += dFj;
            }
            Fi = getSize(layers, j, i);
            // Fi = (getSize(layers, j, i) + getSize(layers, j, i - 1)) / 2;

            curDeltaG = curDeltaG * Fi;
            // curDeltaG *= 1;
            
            deltaG += curDeltaG;
        }
        if(totalSize!==0){

            deltaG = (deltaG / totalSize);        
            // deltaG = (deltaG /layers.length );
            
        }else{
            deltaG = 0
        }
        deltaG = -deltaG;
        // deltaG = (deltaG / m);
        baseline[i] = baseline[i - 1] + deltaG;
    }
    console.log("beseline");
    console.log(baseline);
    // for(let i=0;i<baseline.length;i++){
    //     console.log(baseline[i]);
    // }
    layers = stackOnBaseline(layers, baseline);
    return layers;
}




/* SORTING */
/**
 * Creates a 'top' and 'bottom' collection.
 * Iterating through the previously sorted list of layers, place each layer
 * in whichever collection has less total mass, arriving at an evenly
 * weighted graph. Reassemble such that the layers that appeared earliest
 * end up in the 'center' of the graph.
 **/

export function LataOnsetSort(timesScan_EuroVis,timesRepeat_EuroVis,layers) {//前面两个是无用的参数，因为另一种排序方法需要调用至少三个参数
    //为了简写LiuTu中的代码因此在这里把排序函数写成制式的样子
    layers = JSON.parse(JSON.stringify(layers))
    for (let i = 0; i < layers.length; i++) {
        layers[i].arithmeticSum = layers[i].size.reduce((a, b) => (a + b))
    }
    layers = shuffle(layers)
    console.log(layers)
    console.log('这是一条测试')
    layers.sort(function (p, q) {
        return p.onset - q.onset;
        // if(p.onset!==q.onset){
        // }
    });
    layers = orderToOutside(layers);
    return layers;
}

function orderToOutside(layers) {
    layers = JSON.parse(JSON.stringify(layers))
    var topList = [];
    var topSum = 0;
    var botList = [];
    var botSum = 0;

    // Partition top and bottom.
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (topSum < botSum) {
            topList.push(layer);
            topSum += layer.arithmeticSum;
        } else {
            botList.push(layer);
            botSum += layer.arithmeticSum;
        }
    }

    // Reassemble
    var ordered = [];
    for (var i = 0; i < botList.length; i++)
        // ordered.unshift(botList[i]);
        ordered.push(botList[i]);

    for (var i = 0; i < topList.length; i++)
        // ordered.push(topList[i]);
        ordered.unshift(topList[i]);
    console.log("得到LataOnsetSort结果");
    // equalToEuroVis(printLabels(ordered), Labels);
    return ordered;
}
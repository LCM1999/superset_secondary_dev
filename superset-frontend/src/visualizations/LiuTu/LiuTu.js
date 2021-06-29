import echarts from 'echarts';
import PropTypes from 'prop-types';
import { CategoricalColorNamespace } from '@superset-ui/color';//还没用到
import {UnOrder,quantifyReadability,getYTop_YBottom} from './js/Util_getData'
import {LataOnsetSort,StreamLayout2} from './js/Layout_2norm'
import {TwoOpt_EuroVis,StreamLayout_EuroVis} from './js/Layout_EuroVis'
import {HierarchicalClusteringOrder,StreamLayout_2norm_Gauss} from './js/Layout_Ours'
import {assignLayersColor_4Color} from './js/ColorAssignment'
import {drawGraphLabels,drawHCluster_BinaryTree} from './js/Util_DrawGraph'
//import {getLabelsData} from './js/Util_getLabelsData'
import * as d3  from 'd3597' //他包里的d3提示没有scaleLinear这个函数,因为现在引用不加（）
import {A_Copy_Of} from './js/lib/buchuan1023'
import { getCenter } from 'geolib';

const propTypes = {
    data: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
};
/****
 * 这个渲染逻辑仅仅支持啦三种不同的排序方式进行渲染，布局方式是特定的，如需添加更换布局方式的功能需要重写布局方法的函数！！！
 */



//下面是global中的全局变量
var OrderFunctions = [UnOrder, LataOnsetSort, TwoOpt_EuroVis, HierarchicalClusteringOrder]; //order方法合集
var LayoutFunctions = [StreamLayout2, StreamLayout_EuroVis, StreamLayout_2norm_Gauss]; //布局方法合集
var WeightTypes = ["arithmetic", "geometric", "harmonic", "max"];
var OrderFunctionNames = ["_UnOrder_", "_LataOnset_", "_TwoOpt_", "_HCluster_"];
var LayoutFunctionNames = ["_2norm_", "_1norm_", "_Ours_", "_MinProduct_"];
var WeightTypeNames = ["_arithMean_", "_geoMean_", "_harmoMean_", "_max_"];
var CType = ["mean",
        "median",
        "geometric",
        "harmonic" //不好用
    ][0]
var assignColor = false
var getLabelsDataFunction = getLabelsData
var drawLabelsFunction = drawGraphLabels
var drawHCtree = false;//原本是是否画二叉树的按钮，这里默认否
var labelsData;

    //生成新的div
var graphIndex = 0;
var linearY;
var margin = {
    top: 120,
    bottom: 60,
    left: 10,//决定图表在窗口中的位置
    right: 200,
};
var linearY;
let max_Label_FontSize = 50
let min_Label_FontSize = 1
let LineDrawer;
let StreamGraphLength = -1;
let LabelID = 0;
let timesScan_EuroVis = 10;
let timesRepeat_EuroVis = 5;


//定义渲染逻辑
function LiuTu(element, props) {

const{
    data,
    width,
    height,
    formData,
    series,
} = props;

const fd = formData;
const wd = 1400;
const he = 400;

//定义一下选择的方法种类之类的
let StreamGraph_Map = [
    [
        [false],
        [false, false, true],
        []
    ], //排序方法,[布局方法],[层次聚类权重类型]
    [
        [false],
        [true, false, false],
        []
    ], //排序方法,[布局方法],[层次聚类权重类型]
    [
        [false],
        [false, true, false],
        []
    ], //排序方法,[布局方法],[层次聚类权重类型]
    [
        [true],
        [false,false, true],
        [true,false,false, false]
    ] //排序方法,[布局方法],[层次聚类权重类型]
]
//根据用户选取的排序方式来画图
let order = fd.orderChoose

if (order === '2norm'){
    StreamGraph_Map[1][0][0] = true;
    StreamGraph_Map[3][0][0] = false;
}
else if (order === 'EuroVis'){
    StreamGraph_Map[2][0][0] = true;
    StreamGraph_Map[3][0][0] = false;
}


// console.log('这是一条测试')
// console.log(StreamGraph_Map)


//数据读取
let initialLayers = series //直接拿到后端处理过的数据
let currentLayers = JSON.parse(JSON.stringify(initialLayers))
// console.log(currentLayers)
// console.log('这是一条测试')
let layersData
var selected_X_range_start = 0, selected_X_range_end = initialLayers[0].size.length - 1;
console.log(selected_X_range_end)
console.log(d3)
var initialLinearX = d3.scaleLinear().domain([0, selected_X_range_end]) 
                    .range([0, width])
var currentLinearX = d3.scaleLinear().domain(initialLinearX.domain())
                    .range(initialLinearX.range())

let LayersArea = d3.area()
                    .curve(d3.curveBasis)
                    .x(function (d) {
                        return currentLinearX(d.time);
                    })
                    .y0(function (d) {
                        return linearY(d[0]);
                    })
                    .y1(function (d) {
                        return linearY(d[1]);
                    });
       
        const div = d3.select(element);
        const sliceId = 'liutu' + fd.sliceId;
        const html = '<div id='+ sliceId + ' style="height:' + height + 'px; width:' + width + 'px;"></div>';
        div.html(html);
        


        for (let i = 0; i < StreamGraph_Map.length; i++) { //遍历order方法
            if (StreamGraph_Map[i][0][0]) {
               let orderFunction = OrderFunctions[i] //得到排序方法
                // currentLayers = orderFunction(currentLayers) //得到排序结果
                for (let j = 0; j < StreamGraph_Map[i][1].length; j++) { //遍历布局方法
                    if (StreamGraph_Map[i][1][j]) {
                        let layoutFuntion = LayoutFunctions[j]; //得到布局方法
                        if (StreamGraph_Map[i][2].length > 0) { //如果是进行层次聚类排序的话
                            for (let k = 0; k < StreamGraph_Map[i][2].length; k++) {
                                if (StreamGraph_Map[i][2][k]) {

                                    currentLayers = orderFunction(currentLayers, WeightTypes[k], selected_X_range_start, selected_X_range_end) //得到排序结果
                                    let HCtree = currentLayers.HCtree;
                                    currentLayers = layoutFuntion(currentLayers,CType);

                                    // let userstudy_data = {
                                    //     comment: "order_baseline",
                                    //     type: "ours_ours",
                                    //     data: currentLayers
                                    // }
                                    // console.log(JSON.stringify(userstudy_data));
                                    // console.log('这是一条测试')
                                    layersData = getLayersData(currentLayers,he);
                                    let coloredLayersData = layersData
                                    
                                    
                                    if (assignColor) {
                                        coloredLayersData = assignLayersColor_4Color(currentLayers,
                                            layersData)
                                    }
                                    
                                    //这个本来是在下面函数里的第二个参数的str中的一部分，因为数据库提取的文件没有fileName元素所以直接用table的name代替了 initialLayers.fileName +
                                    //另外将布局方法名字和平均名字都删除了因为这个在本次集成中是不可更改的
                                    drawStreamGraph(currentLinearX,sliceId,coloredLayersData," ", graphIndex,margin,LayersArea,wd,he)

                                        let labelsData = getLabelsDataFunction(currentLayers, graphIndex,
                                         currentLinearX,margin,max_Label_FontSize,min_Label_FontSize,wd,he);
                                    drawLabelsFunction(labelsData, graphIndex)
                                    //是否画二叉树
                                    if (drawHCtree && HCtree !== undefined) {
                                        drawHCluster_BinaryTree(HCtree, "liutu_data", graphIndex)
                                    }
                                    graphIndex++
                                }
                            }
                        } else {
                            currentLayers = orderFunction(timesScan_EuroVis,timesRepeat_EuroVis,currentLayers) //得到排序结果
                            let HCtree = currentLayers.HCtree;
                            currentLayers = layoutFuntion(currentLayers);
               
                        //     let userstudy_data = {
                        //         comment: "order_baseline",
                        //         type: "TwoOpt_1norm",
                        //         data: currentLayers
                        //     }
                        //     console.log(JSON.stringify(userstudy_data));

                        //    console.log(currentLayers);
                        //    console.log('这是一条测试');

                           layersData = getLayersData(currentLayers,he);

                           let coloredLayersData = layersData
                           if (assignColor) {
                               coloredLayersData = assignLayersColor_4Color(currentLayers, layersData)
                           }
                           drawStreamGraph(currentLinearX,sliceId,coloredLayersData, " ", graphIndex,margin,LayersArea,wd,he)
                            //画layers的标签
                            labelsData = getLabelsDataFunction(currentLayers, graphIndex, currentLinearX
                                ,margin,max_Label_FontSize,min_Label_FontSize,wd,he);
                            drawLabelsFunction(A_Copy_Of(labelsData), graphIndex)
                            //是否画二叉树
                            if (drawHCtree && HCtree !== undefined) {
                                drawHCluster_BinaryTree(HCtree, "liutu_data", graphIndex)
                            }
                        graphIndex++
                        }
                    } else {
                        continue
                    }
                }
            } else {
                continue
            }
        }
}

function drawStreamGraph(currentLinearX,sliceId,layersData, text, graphIndex = "0",margin,LayersArea,width,height) {

    // append the svg object to the body of the page
    let svg = d3.select("#"+sliceId)
        .append("svg")
        .attr("id", "myGraph_svg_" + graphIndex)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("version", "1.1")
        .append("g")
        .attr("id", "myAxis_g_" + graphIndex)
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // X轴 tick决定最小刻度
    
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(currentLinearX).ticks(10))
   

    svg.append("g")
        .call(d3.axisLeft(linearY))
    //画layers的name
    svg = d3.select("#" + "myGraph_svg_" + graphIndex)
        .append("g")
        .attr("id", "myLayers_g_" + graphIndex)
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
        // console.log(margin.left)
        // console.log('这是一条测试信息')
    //画layers
    svg.selectAll("path")
        .data(layersData)
        .enter()
        .append("path")
        .style("fill", function (d) {
            return d.fillcolor;
        })
        .style("fill-opacity", 1)
        .style("stroke", function (d) {
            return "white";
        })
        .style("stroke-width", function (d) {
            return 0;
        })
        .attr("name", function (d) {
            return d.name
        })
        .attr("d", LayersArea)
        .on("click", function (d) {
            let id = d.id;
            drawLineChart(id, d);
        })
        ///自己加的
        .on('mousemove',function(d,i){
            console.log('over');
            var x = d3.event.pageX;
            var y = d3.event.pageY + 30;
            tooltip.style("opacity",0.0);
            tooltip.html("花费"+d.value+"元")
                                    .style("left",x+"px")
                                    .style("top",y+"px")
                                    .style("opacity",1.0);
        }).on('mouseout',function(d,i){
            tooltip.style("opacity",0.0);
        });

    d3.select("#" + "myGraph_svg_" + graphIndex)
        .append('text')
        .text(text)
        .attr("x", 10)
        .attr('y', 10)
        .style('font-size', "30px")
        .attr("transform",
            "translate(" + margin.left + "," + (margin.top / 2) + ")");
    
    var tooltip = d3.select("#"+sliceId)
                    .append("div")
                    .attr("class","tooltip")
                    .style("opacity",0)
                 
}


function getLayersData(Layers,height) {
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
    updateLinearY(YBottom, YTop,height)

    return data;
}

function updateLinearY(curYBottom, curYTop,height) {
    linearY = d3.scaleLinear()
    //.domain([curYBottom, curYTop])
    //.domain([-2.2, 2.2])
    .domain([curYBottom * 1.1, curYTop * 1.1])
    .range([height, 0]);
    //.range([height, height - height/4*(curYTop-curYBottom)]);
}

function getLabelsData(layers, graphIndex, linearX,margin,max_Label_FontSize,min_Label_FontSize,width,height) {
    let LabelData = [];
    //这里的Y坐标轴是有点怪，因为是反过来的。同时Y轴不是0-120=》0-1200这样的，而是-100-120=》0-1200
    let absInverseLinearY = d3.scaleLinear()
        .domain(linearY.range().slice().reverse())
        .range([0, Math.abs(linearY.domain()[0]) + Math.abs(linearY.domain()[1])]);

    let label_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        .append("g")
        .attr("id", "cur_myLabels_g_" + graphIndex)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    for (let i = 0; i < layers.length; i++) {
        let layerName = layers[i].name;
        let layerID = layers[i].id;
        label_g.append("text")
            .attr("id", "cur_myLabels_g_" + graphIndex + "_" + layerID)
            .style("font-size", max_Label_FontSize + "px")
            .style("fill", "black")
            .text(layerName)
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
                
                final_Y = linearY((maxAvailabeSpace_ceiling + maxAvailabeSpace_floor) / 2)//这里修改了text的纵向对齐之后，就不用这样修改了。
                final_FontSize = thisFontSize;

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

LiuTu.displayName = 'Liu Tu';
LiuTu.propTypes = propTypes;

export default LiuTu;
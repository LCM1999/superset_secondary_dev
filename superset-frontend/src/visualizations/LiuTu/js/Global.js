import * as d3 from 'd3597'
//这里储存的是各种全局变量，但是还有一些全局变量没有迁移到这里


// let DataPath = [
// //2,5
//     "data/gooddata/7/2.json",
//     //"data/nice looking data/其他/9_30(1).json",
//     //"data/original_data/sandy.json",
// ]

// 2020.09.27
// let DataPath = []
// // let allFiles = ["15", "20", "25", "30", "movie","sandy"]
// let allFiles = []
// for(i=3;i<=35;i++){
//     allFiles.push(i.toString())
// }
// //DataPath = allFiles.map(d=>`./data/original_data/nor_sandy/${d}.json`)
// DataPath = allFiles.map(d=>`./data/original_data/nor_sandy/${d}.json`)

export let DataPath = ["data/nice looking data/与gooddata里重复/20_30(1).json"]

export let color = ["rgb(158,218,229)","rgb(23,190,207)","rgb(219,219,141)",
    "rgb(188,189,34)","rgb(126, 222, 208)","rgb(127,127,127)",
    "rgb(247,182,210)","rgb(227,119,194)","rgb(196,156,148)",
    "rgb(140,86,75)","rgb(86, 204, 11)","rgb(148,103,189)",
    "rgb(255,152,150)","rgb(214,39,40)","rgb(152,223,138)",
    "rgb(44,160,44)","rgb(255,187,120)","rgb(255,127,14)",
    "rgb(174,199,232)","rgb(31,119,180)",'rgb(224, 175, 91)',
    'rgb(188, 180, 10)','rgb(146, 254, 250)','rgb(150,149,191)',
    'rgb(135, 90, 201)','rgb(17, 218, 172)','rgb(199, 67, 196)',
    'rgb(162,163,207)','rgb(169, 143, 131)','rgb(7, 114, 174)']

export let initialLayers = [],
    currentLayers = [],
    Labels = [];

//let Palettes = ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)','rgb(51,160,44)',
// 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)','rgb(255,127,0)',
// 'rgb(202,178,214)', 'rgb(106,61,154)',
// 'rgb(255,255,153)', 'rgb(177,89,40)']
export let Palettes = ['rgb(166,206,227)','rgb(31,120,180)','rgb(178,223,138)','rgb(51,160,44)',
    'rgb(251,154,153)','rgb(227,26,28)','rgb(253,191,111)','rgb(255,127,0)',
    'rgb(202,178,214)','rgb(106,61,154)','rgb(255,255,153)','rgb(177,89,40)',
    'rgb(141,211,199)','rgb(255,255,179)','rgb(190,186,218)','rgb(251,128,114)',
    'rgb(128,177,211)','rgb(253,180,98)','rgb(179,222,105)','rgb(252,205,229)',
    'rgb(217,217,217)','rgb(188,128,189)','rgb(204,235,197)','rgb(255,237,111)'];
export let timesScan_EuroVis = 10;
export let timesRepeat_EuroVis = 5;

let maxTotalSize;

let YTop = Infinity,
    YBottom = -Infinity;

// set the dimensions and margins of the graph
var margin = {
        top: 120,
        bottom: 60,
        left: 10,
        right: 40
    },
//不知道为什么在某一个地方调用了这个全局变量，而不是在liutu中生成的全局变量
    width = 1400,
    height = 400;
export {margin,width,height}

let initialLinearX;
var currentLinearX; 
var linearY;
export {initialLinearX, currentLinearX, linearY}

let max_Label_FontSize = 50
let min_Label_FontSize = 1

// let max_Label_Angel = 45
// let min_Label_Angel = 20

let LayersArea = d3.area()
    // .curve(d3.curveCardinal.tension(0.9))
    // .curve(d3.curveStepAfter)
    .curve(d3.curveBasis)
    // .curve(d3.curveBundle.beta(0.5))
    // .curve(d3.curveNatural)
    // .curve(d3.curveMonotoneX)
    .x(function (d) {
        return currentLinearX(d.time);
    })
    .y0(function (d) {
        return linearY(d[0]);
    })
    .y1(function (d) {
        return linearY(d[1]);
    });

// let LineDrawer = d3.line()
//     // .curve(d3.curveNatural)
//     .curve(d3.curveMonotoneX)
//     .x(function (d) {
//         return currentLinearX(d[0]);
//     })
//     .y(function (d) {
//         return linearY(d[1])
//     })

let LineDrawer;

let StreamGraphLength = -1;
let LabelID = 0;

//layer类
export class Layer {
    constructor(name, size, fillcolor) {
        this.name = name
        this.id = LabelID++;
        this.fillcolor = fillcolor;
        // this.yBottom = []
        // this.yTop = []
        for (var i = 0; i < size.length; i++) {
            if (size[i] < 0) {
                throw ("No negative values allowed");
            }
            // if (Math.abs(size[i]) < 1e-13) {
            //     size[i] = 0;
            // }
        }
        this.size = size.map(d => d);
        if (StreamGraphLength === -1) {
            StreamGraphLength = size.length;
        } else if (size.length !== StreamGraphLength) {
            throw "layers的长度不一致"
        }
        this.onset = -1;
        this.end = -1;
        for (var i = 0; i < size.length; i++) {
            // this.arithmeticSum += size[i];
            if (0 < size[i]) {
                if (this.onset == -1)
                    this.onset = i;
                else
                    this.end = i;
            }
            // if (0 < i)
            //     this.volatility = Math.max(this.volatility, Math.abs(size[i] - size[i - 1]));
        }
        if (this.onset === -1) {
            this.onset = size.length;
        }
        // If we didn't set the end, we only had one data point. So, set it now.
        // Also, might consider moving onset up one, so that we have 3 data points to draw a curve. 
        // if (this.end == -1) {
        //     this.end = this.onset + 1; //this.onset = this.onset == 0 ? 0 : this.onset - 1;
        // }
        if (this.onset === -1 && this.end == -1) {
            //不进行操作
        } else if (this.end === -1) {
            this.end = this.onset
        }
    }
}

//直接清洗从图例网站得来的数据
function copyUrl2() {
    var Url2 = document.getElementById("StringData");
    Url2.select(); // 选择对象
    document.execCommand("Copy"); // 执行浏览器复制命令
    // alert("已复制好，可贴粘。");
}
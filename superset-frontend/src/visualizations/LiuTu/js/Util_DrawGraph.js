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

import{initialLinearX, 
    currentLinearX, 
    linearY,
    margin,
    width,
    height}from './Global' 

import * as d3 from 'd3597'

/*
函数:绘制layer标签
参数:
备注:
*/


export function drawGraphLabels(labelsData, graphIndex) {

    d3.select("#" + "myGraph_svg_" + graphIndex)
        .select("#" + "myLabels_g_" + graphIndex)
        .remove()

    let labels_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        .append("g")
        .attr("id", "myLabels_g_" + graphIndex)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    labels_g.selectAll("text")
        .data(labelsData)
        .enter()
        .append("text")
        .attr("id", d => ("myLabels_g_" + graphIndex + "_" + d.id))
        .style("font-size", d => (d.fontsize + "px"))
        .style("fill", d => d.lableColor)
        .style("fill-opacity", d => d.opacity)
        .attr('label_opacity', d => d.opacity)
        .attr("transform", d => ("translate(" + d.x + "," + d.y + ")"))
        .text(d => d.name)
        .attr("dominant-baseline", "middle")



    //画出text所在的矩形框
    // let rect_lable_g = d3.select("#" + "myGraph_svg_" + graphIndex)
    //     .append("g")
    //     .attr("id", "myRects_g_" + graphIndex)
    //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    // rect_lable_g.selectAll("rect")
    //     .data(labelsData)
    //     .enter()
    //     .append("rect")
    //     .style("fill", "none")
    //     .attr("transform", d => ("translate(" + d.x + "," + (d.y - d.height/2 ) + ")"))
    //     // .attr("transform", d => ("translate(" + d.x + "," + (d.y - d.height + d.height / 3.5) + ")"))
    //     .attr("width", d => d.width)
    //     .attr("height", d => d.height)
    //     .attr("stroke-width", 0.3)
    //     .attr("stroke", "black")
}

/*
函数:绘制layer标签
参数:
备注:
*/
export function drawGraphLabels2(labelsData, graphIndex) {

    d3.select("#" + "myGraph_svg_" + graphIndex)
        .select("#" + "myLabels_g_" + graphIndex)
        .remove()
    d3.select("#" + "myGraph_svg_" + graphIndex)
        .select("#" + "myLabels_Path_g_" + graphIndex)
        .remove()


    let labels_path_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        .append("g")
        .attr("id", "myLabels_Path_g_" + graphIndex)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    let labels_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        .append("g")
        .attr("id", "myLabels_g_" + graphIndex)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    LineDrawer = d3.line()
        // .curve(d3.curveBasis)
        .curve(d3.curveBundle)
        // .curve(d3.curveNatural)
        // .curve(d3.curveMonotoneX)
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y
        })

    let label_paths = labelsData.map(function (d) {
        cur = d.label_path
        cur.name = d.name;
        cur.id = d.id;
        return cur
    })

    labels_path_g.selectAll("path")
        .data(label_paths)
        .enter()
        .append("path")
        .attr("id", d => "myLabels_Path_g_" + graphIndex + "_" + d.id)
        .style("stroke", "white")
        .style("stroke-width", 0)
        .style("fill", "none")
        .attr("d", LineDrawer)

    labels_g.selectAll("text")
        .data(labelsData)
        .enter()
        .append("text")
        .attr("id", d => ("myLabels_g_" + graphIndex + "_" + d.id))

    labels_g.selectAll("text")
        .append("textPath")

    labels_g.selectAll("textPath")
        .data(labelsData)
        .text(d => d.name)
        .attr("id", d => ("myLabels_g_" + graphIndex + "_" + d.id))
        .style("fill", d => d.lableColor)
        .style("fill-opacity", d => d.opacity)
        .attr('label_opacity', d => d.opacity)
        .attr("xlink:href", d => "#myLabels_Path_g_" + graphIndex + "_" + d.id)
        // .attr("font-family", "monospace")
        .style("font-size", d => (d.fontsize + "px"))
        .attr("dominant-baseline", "middle")
}


/*
函数:用来画层析聚类的二叉树的方法
参数:
备注:
*/
export function drawHCluster_BinaryTree(data, text, treeIndex) {
    let node_R = 10;
    let tree_svg_height = height - 100,
        tree_svg_width = width;
    // let svg = d3.select("#my_datavis_tree")

    d3.select("#my_datavis").select("#myTree_svg_" + treeIndex).remove()

    let svg = d3.select("#my_datavis")
        .append("svg")
        .attr("id", "myTree_svg_" + treeIndex)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("version", "1.1")
    // xmlns="http://www.w3.org/2000/svg" version="1.1"

    svg.append('text')
        .text(text)
        .attr("x", 10)
        .attr('y', 10)
        .style('font-size', "30px")
        .style("font-weight", "bold")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    // svg.select("#myLinks_g_"+graphIndex).remove()
    // svg.select("#myNodes_g_"+graphIndex).remove()
    // svg.select("#myTexts_g_"+graphIndex).remove()

    if (data === undefined) {
        return
    }

    var root = d3.hierarchy(data)

    var treeLayout = d3.cluster()
        .size([tree_svg_width, tree_svg_height])
    // .size([root.leaves().length*10, root.height*30])

    // var treeLayout = d3.tree()
    //     .size([tree_svg_width, tree_svg_height])

    treeLayout(root)

    d3.selectAll("#" + "myTree_svg_" + treeIndex)
        .on("click", function (d) {
            d3.select("#" + "myGraph_svg_" + treeIndex)
                .select("#" + "myLayers_g_" + treeIndex)
                .selectAll("path")
                .style("fill-opacity", 1)

            d3.select("#" + "myGraph_svg_" + treeIndex)
                .select("#" + "myLabels_g_" + treeIndex)
                .selectAll("text")
                .style("fill-opacity", d => d.opacity)


        })


    let links = root.links()

    // Links
    d3.select("#" + "myTree_svg_" + treeIndex)
        .append('g')
        .attr("id", "myLinks_g_" + treeIndex)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll("line")
        .data(root.links())
        .enter()

        .append('polyline')
        .attr('points', function (d) {
            return `${d.source.x},${d.source.y + node_R / 2}
                ${Math.min(d.source.x, d.target.x) + (d.source.x < d.target.x ? 0.75 * Math.abs(d.source.x - d.target.x) : 0.25 * Math.abs(d.source.x - d.target.x))},${d.source.y + (tree_svg_height / root.height) * 0.5}
                ${d.target.x},${d.target.y + node_R / 2}`;
        })
        .style("stroke-width", 1)
        .style("stroke", "red")
        .style("fill", "white")

    // Nodes
    d3.select("#" + "myTree_svg_" + treeIndex)
        .append('g')
        .attr("id", "myNodes_g_" + treeIndex)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll("circle")
        .data(root.descendants())
        .enter()
        .append('circle')
        .classed('node', true)
        .attr('cx', function (d) {
            return d.x;
        })
        .attr('cy', function (d) {
            return d.y + 10;
        })
        .attr('r', node_R)
        .style("fill", d => d.data.fillcolor)
        .on("click", function (d) {
            event.stopPropagation(); //阻止事件冒泡

            let layers_g = d3.select("#" + "myGraph_svg_" + treeIndex)
                .select("#" + "myLayers_g_" + treeIndex)
            layers_g.selectAll("path")
                .style("fill-opacity", 0.1)

            let labels_g = d3.select("#" + "myGraph_svg_" + treeIndex)
                .select("#" + "myLabels_g_" + treeIndex)
            labels_g.selectAll("text")
                .style("fill-opacity", 0.1)

            let leaves = d.leaves()

            for (let i = 0; i < leaves.length; i++) {
                layers_g.select(`path[name="${leaves[i].data.name}"]`)
                    .style("fill-opacity", 1)
                labels_g.select(`#myLabels_g_${treeIndex}_${leaves[i].data.id}`)
                    .style("fill-opacity", d => d.opacity)
            }

        })

    // Texts
    d3.select("#" + "myTree_svg_" + treeIndex)
        .append('g')
        .attr("id", "myTexts_g_" + treeIndex)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll("text")
        .data(root.descendants())
        .enter()
        .append('text')
        .style('font-size', "40px")
        .attr("transform", d => `translate(${d.x},${d.y + 30}) rotate(60)`)
        .text(function (d) {
            // if (d.children === undefined) {
            //     return d.data.name;
            // }
            return d.data.name;
        })
}


/*
函数:用来画图的函数
参数:
备注:
*/
export function drawStreamGraph(layersData, text, graphIndex = "0") {

    // append the svg object to the body of the page
    let svg = d3.select("#my_datavis")
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

    // X轴
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(currentLinearX).ticks(10))
    // //Y轴
    // let curNum = getYTop_YBottom(layersData);
    // YBottom = curNum[0];
    // YTop = curNum[1];
    // updateLinearY(YBottom, YTop)

    svg.append("g")
        .call(d3.axisLeft(linearY))

    svg = d3.select("#" + "myGraph_svg_" + graphIndex)
        .append("g")
        .attr("id", "myLayers_g_" + graphIndex)
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    //画layers
    svg.selectAll("path")
        .data(layersData)
        .enter()
        .append("path")
        // .attr("pathType", "mylayers")
        .style("fill", function (d) {
            // return rgb2hex(d.fillcolor);
            return d.fillcolor;
        })
        .style("fill-opacity", 1)
        .style("stroke", function (d) {
            return "white";
        })
        .style("stroke-width", function (d) {
            // return 0.2;
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

    // // layers的中线或者中点
    // let LineDrawer = d3.line()
    //     // .curve(d3.curveNatural)
    //     // .curve(d3.curveMonotoneX)
    //     .x(function (d) {
    //         return currentLinearX(d.time);
    //     })
    //     .y(function (d) {
    //         return (linearY(d[0]) + linearY(d[1])) / 2;
    //     })
    // svg = d3.select("#" + "myGraph_svg_" + graphIndex)
    //     .append("g")
    //     .attr("id", "myMiddleLines_g_" + graphIndex)
    //     .attr("transform",
    //         "translate(" + margin.left + "," + margin.top + ")");

    // svg.selectAll("path")
    //     .data(layersData)
    //     .enter()
    //     .append("path")
    //     .style("fill", "none")
    //     .style("stroke", "black")
    //     // .style("stroke-dasharray", "1,1")
    //     .style("stroke-width", function (d) {
    //         return "2px";
    //     })
    //     .attr("name", function (d) {
    //         return d.name
    //     })
    //     .attr("d", LineDrawer)

    // let allMiddlePoints = []
    // for(let i=0;i<layersData.length;i++){
    //     for(let j=0;j<layersData[i].length;j++){
    //         if(layersData[i].name==="Furious 7"){
    //             allMiddlePoints.push([layersData[i][j].time,layersData[i][j][0]/2+layersData[i][j][1]/2])
    //             allMiddlePoints.push([layersData[i][j].time,layersData[i][j][0]])
    //             allMiddlePoints.push([layersData[i][j].time,layersData[i][j][1]])

    //         }
    //     }
    // }
    // svg.selectAll("circle")
    //     .data(allMiddlePoints)
    //     .enter()
    //     .append("circle")
    //     .style("fill", "black")
    //     .style("stroke", "white")
    //     .style("stroke-width", function (d) {
    //         return "1";
    //     })
    //     .attr("r", 2)
    //     .attr("cx", d=>currentLinearX(d[0]))
    //     .attr("cy", d=>linearY(d[1]))






    d3.select("#" + "myGraph_svg_" + graphIndex)
        .append('text')
        .text(text)
        .attr("x", 10)
        .attr('y', 10)
        .style('font-size', "40px")
        .attr("transform",
            "translate(" + margin.left + "," + (margin.top / 2) + ")");
}


export function addAdjustBar(layers, graphIndex) {

    //两个指针的Y坐标
    let slider_Y = 650
    //两个指针的初始位置
    let slider_X_left = initialLinearX(Math.round(initialLinearX.invert(width / 6)))
    let slider_X_right = initialLinearX(Math.round(initialLinearX.invert(width / 6 * 5)))
    //这个指针的移动方位
    let slider_X_range_start = 0,
        slider_X_range_end = width;
    //移动前的指针所在位置
    let pre_pointer_X = 0;

    let link_move_id = undefined;


    let bars_g = d3.select("#" + "myGraph_svg_" + graphIndex)
        .append("g")
        .attr("id", "mySlider_g_" + graphIndex)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    let movePointerFunc = d3.drag()
        .on("start", movePointer_start)
        .on("drag", movePointer)
        .on("end", movePointer_end);


    //滚动条之间的矩形
    bars_g.append("rect")
        .attr("x", slider_X_left)
        .attr("y", slider_Y)
        .attr("width", (slider_X_right - slider_X_left))
        .attr("height", 40)
        .style("fill", "black")
        .style("fill-opacity", "0.3")
        .attr("id", "slider_g_pointer_rect")

    //左边滚动条
    bars_g.append("g")
        .attr("transform", "translate(" + (slider_X_left - 10) + "," + slider_Y + ")")
        .attr("id", "slider_g_pointer_left")
        .call(movePointerFunc)

        .append("polygon")
        .attr("class", "slider_pointer")
        .attr("id", "pointer_left")
        .attr("points", "10,0 20,20 20,40 0,40 0,20")

    //右侧滚动条
    bars_g.append("g")
        .attr("transform", "translate(" + (slider_X_right - 10) + "," + slider_Y + ")")
        .attr("id", "slider_g_pointer_right")
        .call(movePointerFunc)

        .append("polygon")
        .attr("class", "slider_pointer")
        .attr("id", "pointer_right")
        .attr("points", "10,0 20,20 20,40 0,40 0,20")

    let rect_margin_top = margin.top * 2
    let rect_margin_left = slider_X_left
    let rect_width = slider_X_right - slider_X_left
    let rect_height = height - rect_margin_top * 2

    //用来放大显示的矩形
    bars_g.append("rect")
        .attr("x", rect_margin_left)
        .attr("y", rect_margin_top)
        .attr("width", rect_width)
        .attr("height", rect_height)
        .style("fill", "none")
        .style("stroke", "gray")
        .style("stroke-width", 2)

    //左侧指引线
    bars_g.append("line")
        .attr("id", "slider_g_link_left")
        .attr("x1", rect_margin_left)
        .attr("y1", rect_margin_top + rect_height)
        .attr("x2", slider_X_left)
        .attr("y2", slider_Y)
        .style("stroke-width", 2)
        .style("stroke", "red")

    //右侧指引线
    bars_g.append("line")
        .attr("id", "slider_g_link_right")
        .attr("x1", rect_margin_left + rect_width)
        .attr("y1", rect_margin_top + rect_height)
        .attr("x2", slider_X_right)
        .attr("y2", slider_Y)
        .style("stroke-width", 3)
        .style("stroke", "red")


    //移动指针开始的方法
    function movePointer_start(d) {
        let bar_id = d3.select(this).select("polygon").attr("id")
        if (bar_id === "pointer_left") {
            slider_X_range_start = initialLinearX(1)
            slider_X_range_end = parseFloat(d3.select(this.parentNode).select("#slider_g_pointer_right").attr("transform").split("(")[1].split(",")[0]) - initialLinearX(1) + 10 //这里不需要再-10里，因为获得的就是调整后的位置，已经-10了
            pre_pointer_X = parseFloat(d3.select(this).attr("transform").split("(")[1].split(",")[0])
            link_move_id = "slider_g_link_left"
        } else {
            slider_X_range_start = parseFloat(d3.select(this.parentNode).select("#slider_g_pointer_left").attr("transform").split("(")[1].split(",")[0]) + initialLinearX(1) + 10 //这里不需要再-10里，因为获得的就是调整后的位置，已经-10了
            slider_X_range_end = parseFloat(initialLinearX(currentLayers[0].size.length - 2))
            pre_pointer_X = parseFloat(d3.select(this).attr("transform").split("(")[1].split(",")[0])
            link_move_id = "slider_g_link_right"
        }
    }
    //移动指针的方法
    function movePointer(d) {
        // console.log(d3.event.x + " " + d3.event.y);
        let thisX = initialLinearX(Math.round(initialLinearX.invert(d3.event.x))) //这里是要-10的，因为thisX最终要应用到X的位置上去

        if (thisX >= slider_X_range_start && thisX <= slider_X_range_end) {

        } else if (thisX < slider_X_range_start) {
            thisX = slider_X_range_start
        } else {
            thisX = slider_X_range_end
        }
        d3.select(this)
            .attr("transform", `translate(${thisX - 10},${slider_Y})`)

        //如果有指针的位置已经发生了变化的话
        if (thisX !== pre_pointer_X) {
            let pointer_left_X = parseFloat(d3.select(this.parentNode).select("#slider_g_pointer_left").attr("transform").split("(")[1].split(",")[0]) + 10
            let pointer_right_X = parseFloat(d3.select(this.parentNode).select("#slider_g_pointer_right").attr("transform").split("(")[1].split(",")[0]) + 10

            //移动矩形
            d3.select(this.parentNode)
                .select("#slider_g_pointer_rect")
                .attr("x", pointer_left_X)
                .attr("width", (pointer_right_X - pointer_left_X))

            let pointer_left_X_data = initialLinearX.invert(pointer_left_X)
            let pointer_right_X_data = initialLinearX.invert(pointer_right_X)
            //比例尺发生变化
            currentLinearX = d3.scaleLinear()
                .domain([0, pointer_left_X_data, pointer_right_X_data, layersData[0].length - 1])
                .range([0, rect_margin_left, rect_margin_left + rect_width, width])

            //streamgraph根据比例尺进行变换
            let streamLayers = d3.select("#myLayers_g_" + graphIndex).selectAll("path");
            streamLayers.data(layersData)
                .transition()
                .attr("name", function (d) {
                    return d.name
                })
                .style("fill", function (d) {
                    return d.fillcolor;
                })
                .attr("d", LayersArea);
            pre_pointer_X = thisX
        }
        d3.select(this.parentNode)
            .select("#" + link_move_id)
            .attr("x2", thisX)
    }
    //移动指针结束的方法
    function movePointer_end(d) {
        let pointer_left_X = parseFloat(d3.select(this.parentNode).select("#slider_g_pointer_left").attr("transform").split("(")[1].split(",")[0]) + 10
        let pointer_right_X = parseFloat(d3.select(this.parentNode).select("#slider_g_pointer_right").attr("transform").split("(")[1].split(",")[0]) + 10

        let pointer_left_X_data = Math.round(initialLinearX.invert(pointer_left_X))
        let pointer_right_X_data = Math.round(initialLinearX.invert(pointer_right_X))

        //比例尺发生变化
        currentLinearX = d3.scaleLinear()
            .domain([0, pointer_left_X_data, pointer_right_X_data, layersData[0].length - 1])
            .range([0, rect_margin_left, rect_margin_left + rect_width, width])

        labelsData = getLabelsData(currentLayers, graphIndex, currentLinearX)
        let streamLabels = d3.select("#myLabels_g_0").selectAll("text");
        streamLabels.data(labelsData)
            .transition()
            .duration(1000)
            .style("font-size", d => (d.fontsize + "px"))
            .attr("transform", d => ("translate(" + d.x + "," + d.y + ")"))
        selected_X_range_start = pointer_left_X_data
        selected_X_range_end = pointer_right_X_data
    }
}


/**
 * 
 * @param {*} layersData 
 * @param {*} graphIndex 
 */
export function reDrawLayers(layersData, graphIndex) {

    let streamLayers = d3.select("#myLayers_g_" + graphIndex).selectAll("path");
    streamLayers.data(layersData)
        .transition()
        .duration(2000)
        .attr("name", function (d) {
            return d.name
        })
        .style("fill", function (d) {
            return d.fillcolor;
        })
        .attr("d", LayersArea);
}

export function reDrawLabels(labelsData, graphIndex) {

    let streamLabels = d3.select("#myLabels_g_" + graphIndex).selectAll("text");
    streamLabels.data(labelsData)
        .transition()
        .duration(2000)
        .style("font-size", d => (d.fontsize + "px"))
        .attr("transform", d => ("translate(" + d.x + "," + d.y + ")"))
        .text(d => d.name)
        // .text(d => d.initialName)
        .attr("id", d => ("myLabels_g_" + graphIndex + "_" + d.id))
        .attr("dominant-baseline", "middle")
}


export function addLayerSelector() {

    d3.select("#layersSelector_Div")
        .select("#layersSelector_Form")
        .selectAll("input")
        .remove()
    d3.select("#layersSelector_Div")
        .select("#layersSelector_Form")
        .selectAll("label")
        .remove()
    d3.select("#layersSelector_Div")
        .select("#layersSelector_Form")
        .selectAll("br")
        .remove()

    let layerSelector_Form = d3.select("#layersSelector_Div")
        .select("#layersSelector_Form")

    for (let i = 0; i < initialLayers.length; i++) {
        layerSelector_Form.append("input")
            .attr("type", "checkbox")
            .attr("value", initialLayers[i].name)
            .attr("id", "layerSelector_" + initialLayers[i].id)
            .attr("class", "layerSelector")
            .attr("checked", true)

        layerSelector_Form.append("label")
            .attr("class", "layerName")
            .text(initialLayers[i].name)
            .on("click", function () {
                let cur = document.getElementById("layerSelector_" + initialLayers[i].id).checked;
                document.getElementById("layerSelector_" + initialLayers[i].id).checked = !cur;
            })
        layerSelector_Form.append("br")
    }
}

export function reLayoutGraph() {

    let preLayers_Count = currentLayers.length;

    currentLayers = JSON.parse(JSON.stringify(initialLayers))

    for (let i = initialLayers.length - 1; i >= 0; i--) {
        if (!document.getElementById("layerSelector_" + initialLayers[i].id).checked) {
            currentLayers.splice(i, 1)
        }
    }

    // let gap = currentLayers.length - preLayers_Count;

    // //进行layer，label的补充或者删除
    // //变少了
    // if (gap < 0) {
    //     for (let i = 0; i < -gap; i++) {
    //         d3.select("#myGraph_svg_0")
    //             .select("#myLayers_g_0")
    //             .select("path")
    //             .remove();
    //         d3.select("#myGraph_svg_0")
    //             .select("#myLabels_g_0")
    //             .select("text")
    //             .remove();
    //     }
    // } else {
    //     for (let i = 0; i < gap; i++) {
    //         d3.select("#myGraph_svg_0")
    //             .select("#myLayers_g_0")
    //             .append("path")
    //             .style("fill", "white")
    //         d3.select("#myGraph_svg_0")
    //             .select("#myLabels_g_0")
    //             .append("text")
    //             // .attr("class", "layer_Lable")
    //             .style("fill-opacity", 0.7)
    //             .attr("transform", `translate(${width / 2},${height / 2})`)
    //     }
    // }

    // currentLayers = orderFunction(currentLayers, "arithmetic", selected_X_range_start, selected_X_range_end) //得到排序结果
    // currentLayers = layoutFuntion(currentLayers);

    // layersData = getLayersData(currentLayers);
    // // let curNum = getYTop_YBottom(layersData);
    // // YBottom = curNum[0];
    // // YTop = curNum[1];
    // // // console.log("得到上下极值：YBottom " + YBottom + " YTop " + YTop);
    // // updateLinearY(YBottom, YTop)
    // reDrawLayers(layersData, 0)


    // labelsData = getLabelsData(currentLayers, 0, currentLinearX);
    // reDrawLabels(labelsData, 0)

    // let HCtree = currentLayers.HCtree;

    // drawHCluster_BinaryTree(HCtree, initialLayers.fileName, graphIndex - 1)


    d3.select("#my_datavis")
        .selectAll("svg")
        .remove()
    for (let i = 0; i < StreamGraph_Map.length; i++) { //遍历order方法
        if (StreamGraph_Map[i][0][0]) {
            orderFunction = OrderFunctions[i] //得到排序方法
            // currentLayers = orderFunction(currentLayers) //得到排序结果
            for (let j = 0; j < StreamGraph_Map[i][1].length; j++) { //遍历布局方法
                if (StreamGraph_Map[i][1][j]) {
                    layoutFuntion = LayoutFunctions[j]; //得到布局方法
                    if (StreamGraph_Map[i][2].length > 0) { //如果是进行层次聚类排序的话
                        for (let k = 0; k < StreamGraph_Map[i][2].length; k++) {
                            if (StreamGraph_Map[i][2][k]) {

                                currentLayers = orderFunction(currentLayers, WeightTypes[k], selected_X_range_start, selected_X_range_end) //得到排序结果
                                let HCtree = currentLayers.HCtree;
                                currentLayers = layoutFuntion(currentLayers);


                                //画layers和坐标轴
                                layersData = getLayersData(currentLayers);

                                let curNum = getYTop_YBottom(layersData);
                                YBottom = curNum[0];
                                YTop = curNum[1];
                                updateLinearY(YBottom, YTop)

                                // currentLayers = assignLayersColor(currentLayers)

                                layersData = getLayersData(currentLayers);
                                drawStreamGraph(layersData, initialLayers.fileName + OrderFunctionNames[i] +
                                    LayoutFunctionNames[j] + WeightTypeNames[k], graphIndex)


                                labelsData = getLabelsDataFunction(currentLayers, graphIndex, currentLinearX);
                                drawLabelsFunction(labelsData, graphIndex)

                                //添加滑动条
                                // addAdjustBar(currentLayers, graphIndex)
                                // //添加layer选择器
                                // addLayerSelector()

                                if (drawHCtree && HCtree !== undefined) {
                                    drawHCluster_BinaryTree(HCtree, initialLayers.fileName, graphIndex)
                                }
                                graphIndex++
                            }
                        }
                    } else {
                        currentLayers = orderFunction(currentLayers) //得到排序结果
                        let HCtree = currentLayers.HCtree;
                        currentLayers = layoutFuntion(currentLayers);


                        //画layers和坐标轴
                        layersData = getLayersData(currentLayers);

                        let curNum = getYTop_YBottom(layersData);
                        YBottom = curNum[0];
                        YTop = curNum[1];
                        updateLinearY(YBottom, YTop)

                        // currentLayers = assignLayersColor(currentLayers)



                        // console.log(layersData);
                        layersData = getLayersData(currentLayers);
                        drawStreamGraph(layersData, initialLayers.fileName + OrderFunctionNames[i] +
                            LayoutFunctionNames[j], graphIndex)

                        //画layers的标签
                        labelsData = getLabelsDataFunction(currentLayers, graphIndex, currentLinearX);
                        drawLabelsFunction(A_Copy_Of(labelsData), graphIndex)

                        //添加滑动条
                        // addAdjustBar(currentLayers, graphIndex)
                        // //添加layer选择器
                        // addLayerSelector()

                        if (drawHCtree && HCtree !== undefined) {
                            drawHCluster_BinaryTree(HCtree, initialLayers.fileName, graphIndex)
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


export function drawLineChart(layerID, data) {
    // console.log(data);
    
    function getTotalSize() {
        var cur_total_size = A_Copy_Of(currentLayers[0].size)
        for (let i = 1; i < currentLayers.length; i++) {
            cur_total_size = currentLayers[i].size.map(function (d, i) {
                return d + cur_total_size[i]
            })
        }
        return cur_total_size
    }

    let layer = getNumElementByID(currentLayers, layerID)
    let trend_size = layer.size;

    let max_size = d3.max(getTotalSize())

    var trend_linearY = d3.scaleLinear()
        .domain([0, max_size])
        .range([height, 0])

    // var trend_line_data = trend_size.map(function (d, i) {
    //     return [i, d]
    // })

    let bottomLine = data.map(d => d[0])
    let topLine = data.map(d => d[1])

    let interpTop = d3.interpolateBasis(bottomLine);
    let interpBot = d3.interpolateBasis(topLine);

    let length = bottomLine.length
    let thisThickness
    let trend_line_data = []
    for (let i = 0; i < length; i++) {
        for (let j = 0; j < 1; j += 1) {
            thisThickness = Math.abs(interpTop((i + j) / (length - 1)) - interpBot((i + j) / (length - 1)))
            trend_line_data.push([
                [i + j], thisThickness
            ])
        }
    }

    console.log(trend_line_data.map(d=>d[1]));
    


    var trend_line = d3.area()
        .curve(d3.curveBasis)
        .x(function (d) {
            return currentLinearX(d[0])
        })
        .y0(function (d) {
            // return trend_linearY(d[1]) - height 
            // return trend_linearY(0)
            return trend_linearY(d[1]) - height / 4
        })
        .y1(function (d) {
            // return trend_linearY(d[1]) - height
            // return trend_linearY(0)
            return trend_linearY(0) - height / 4
        })

    d3.select("#my_datavis").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("path")
        .datum(trend_line_data)
        // .style("fill", ()=>{layer.fillcolor})
        .style("fill", "black")
        .attr("stroke-width", 0.5)
        .attr("d", trend_line)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

}
import axios from 'axios';//暂时还没用到
import netgraph from '@ideas-lab/netgraph';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
const propTypes = {
    data: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
};

function NetGraph_1 (element,props)
{
    const{
        data,
        width,
        height,
        formData,
        nodes,
        links,
    } = props;
    const fd = formData;


    const data_true = {
        nodes: nodes,
        links: links,
      };
    // console.log(data_true)
    // console.log(data_true.links.length)
    //选择要渲染的dom
    const div = d3.select(element);
    const sliceId = 'netgraph' + fd.sliceId;
    const html = '<div id='+ sliceId + ' style="height:' + height + 'px; width:' + width + 'px;"></div>';
    div.html(html);


    const button = fd.buttonChoose;//前端的x_y的字段形势到这里会变成xY这种
    //console.log(button)


    //console.log('这是一条测试')



    const netGraph = new netgraph({
        canvasProps: {
          containerWidth: width,
          containerHeight: height,
          zoom: 0,
          container: sliceId,//要添加到的dom
          maxZoom: 4,
          minZoom: -4,
        },
        layout: "square",
        data: data_true,
        style: [
          {
            selector: "node",
            style: {
              "width": 0,
              "height": 40,
              "url": (d) => d.data.img,
              "opacity": 1,
              "background-color": "#aaa",
              "background-opacity": 1,
              "border-width": 5,
              "border-color": "#fff",
              "border-opacity": 1,
              "color": "#845624",
              "text-opacity": 1,
              "font-size": 16,
              "text": (d) => d.data.name,
              "shape": "circle",
            },
          },
          {
            selector: "link",
            style: {
              "width": 1,
              "line-color": "#456456",
              "line-opacity": 1,
              "to-arrow-shape": "triangle",
              "to-arrow-color": "#858585",
              "to-arrow-fill": "filled",
              "color": "#845624",
              "text-opacity": 1,
              "font-size": 10,
              "text": (d) => d.data.type,
            },
          },
        ],
      });
    netGraph.addEventListener("nodeClick", (object) => {
        //console.log(object);
      });

    netGraph.addEventListener("brush", (nodeIds) => {
        //console.log(nodeIds);
      });

    
    

  // if (button === 'layout'){
  //   console.log('触发了布局')
  //   const selectedNodes = netGraph.getSelectedNodes();
  //   const selectedNodeIds = new Array();
  //   selectedNodes.map((v, i) => {
  //     selectedNodeIds.push(v.getId());
  //   });
  //   netGraph.setNodeLayout("multSquare");
  // }
  // console.log(netGraph)
  // console.log('用来对比state中的的东西')
  return  netGraph 
}

NetGraph_1.displayName = 'NetGraph';
NetGraph_1.propTypes = propTypes;

export default NetGraph_1;
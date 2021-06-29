import Component from './NetGraph'
import React,{useref,useEffect} from 'react'

var _react = _interopRequireDefault(require("react"));

export function reactify(renderFn,callback){
    function reactComponent(props){
        
        const element = ref
        const [netGraph] = useref(renderFn(element,props));
        

        useEffect(() => {
        console.log(netGraph)
        console.log('查看对象是否存入了state中')
        const selectedNodes = netGraph.getSelectedNodes();
        const selectedNodeIds = new Array();
        selectedNodes.map((v, i) => {
            selectedNodeIds.push(v.getId());
        });
        netGraph.setNodeLayout("multSquare");
        });
        
        const {
            id,
            className
          } = props;

        return _react.default.createElement("div", {
            ref: element,
            id: id,
            className: className
          });

    }

    export default reactify(Component);



}
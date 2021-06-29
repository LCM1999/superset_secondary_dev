import Component from './NetGraph';
//注册文件
"use strict";


var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function reactify(renderFn, callbacks) {
  class ReactifiedComponent extends _react.default.Component {
    constructor(props) {
      super(props);
      this.state = { netgraph: null };
      _defineProperty(this, "container", void 0);
    //   console.log('react里面的东西查看是否传入了表单信息')
    //   console.log(this.state.netgraph)
      this.setContainerRef = this.setContainerRef.bind(this);
    }
    //初次渲染裝載要执行
    componentDidMount() {
        console.log('每次刷新formdata都运行了componentDdMount')
        this.execute();
    } 

   //组件更新的时候要执行
    componentDidUpdate() {
        console.log('查看是否DidUpdate了')
    //     console.log('查看是否DidUpdate了')
    //     const selectedNodes = this.state.netgraph.getSelectedNodes();
    //     const selectedNodeIds = new Array();
    //     selectedNodes.map((v, i) => {
    //         selectedNodeIds.push(v.getId());
    // });
    //     this.state.netgraph.setNodeLayout("multSquare");
    }
   //删除组件时候要执行
    componentWillUnmount() {
      this.container = undefined;
      console.log('组件将要销毁')

      if (callbacks == null ? void 0 : callbacks.componentWillUnmount) {
        callbacks.componentWillUnmount.bind(this)();
      }
    }

    setContainerRef(ref) {
      this.container = ref;
    }

    execute() {
      if (this.container) {
        const a_netgraph=renderFn(this.container, this.props);//前者是DOM后者是传入的数据
        // this.setState({
        //     netgraph : a_netgraph
        // });
        console.log('查看对象是否执行了excute')
      }
    }
    
    //自己添加的更新函数
    // updata(){
    //     if (this.container) {
    //         const a_netgraph=renderFn(this.container, this.props);//前者是DOM后者是传入的数据
    //         this.setState({
    //             netgraph : a_netgraph
    //         });
    //         console.log(a_netgraph)
    //         console.log('查看对象是否存入了state中')
    //       }

    // }


    render() {
      const {
        id,
        className
      } = this.props;//这里的this，porps是外面传入的和render外面的thisprops不一样
      return _react.default.createElement("div", {
        ref: this.setContainerRef,
        id: id,
        className: className
      });
    }

  }

  _defineProperty(ReactifiedComponent, "propTypes", {
    id: _propTypes.default.string,
    className: _propTypes.default.string
  });

  const ReactifiedClass = ReactifiedComponent;

  if (renderFn.displayName) {
    ReactifiedClass.displayName = renderFn.displayName;
  } // eslint-disable-next-line react/forbid-foreign-prop-types


  if (renderFn.propTypes) {
    ReactifiedClass.propTypes = _extends({}, ReactifiedClass.propTypes, {}, renderFn.propTypes);
  }

  if (renderFn.defaultProps) {
    ReactifiedClass.defaultProps = renderFn.defaultProps;
  }

  return ReactifiedComponent;
}



export default reactify(Component);
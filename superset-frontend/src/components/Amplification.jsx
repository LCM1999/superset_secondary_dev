/**自己添加的放大chart按钮，原理是实现url的跳转
*/
import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, OverlayTrigger, MenuItem } from 'react-bootstrap';
import { t } from '@superset-ui/translation';

const propTypes = {
    nextUrl: PropTypes.string,
  };
  
const defaultProps = {
    nextUrl: 'www.baidu.com',
};

export default class Amplification extends React.Component{
    constructor(nextUrl) {
        super(nextUrl);
        this.nextUrl=nextUrl
        this.renderTooltip = this.renderTooltip.bind(this);//用this调用类中的函数需要先在constructor中添加这条声明
    }

    onclick = () => {
        const w = window.open(`${this.nextUrl.nextUrl}`);
        // 要打开的新页面的url
        // w.location.href=this.nextUrl;
    } //这相当于直接把函数赋给变量，因此不用加函数声明

    renderTooltip() {
        return (
          <Tooltip id="copy-to-clipboard-tooltip">点我放大chart</Tooltip>
        );
      }

    render(){
        return(
            <OverlayTrigger
            placement="top"
            overlay={this.renderTooltip()}
            trigger={['hover']}//附加框的触发方式
          >
           <button onClick={this.onclick} >
               <i class="fa fa-camera-retro"></i>
           </button>
        </OverlayTrigger>
        );
    }   
}

Amplification.propTypes = propTypes;
Amplification.defaultProps = defaultProps;
/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Alert } from 'react-bootstrap';

import { SupersetClient } from '@superset-ui/connection';
import { isFeatureEnabled, FeatureFlag } from 'src/featureFlags';
import { Logger, LOG_ACTIONS_RENDER_CHART_CONTAINER } from '../logger/LogUtils';
import Loading from '../components/Loading';
import RefreshChartOverlay from '../components/RefreshChartOverlay';
import StackTraceMessage from '../components/StackTraceMessage';
import ErrorBoundary from '../components/ErrorBoundary';
import ChartRenderer from './ChartRenderer';
import './chart.less';
import { flashQuery } from './chartAction';
import {
  getExploreUrlAndPayload,
  getAnnotationJsonUrl,
  postForm,
} from '../explore/exploreUtils';
import { allowCrossDomain as allowDomainSharding } from '../utils/hostNamesConfig';
import getClientErrorObject from '../utils/getClientErrorObject';

//导入wesocket
import {creat_namespaces_socket,test_var_socket,delete_namespaces_socket} from '../../websockets/socket_client';
import ALLOW_WebSocket from '../../websockets/config';


const propTypes = {
  annotationData: PropTypes.object,
  actions: PropTypes.object,
  chartId: PropTypes.number.isRequired,
  datasource: PropTypes.object.isRequired,
  // current chart is included by dashboard
  dashboardId: PropTypes.number,
  // original selected values for FilterBox viz
  // so that FilterBox can pre-populate selected values
  // only affect UI control
  initialValues: PropTypes.object,
  // formData contains chart's own filter parameter
  // and merged with extra filter that current dashboard applying
  formData: PropTypes.object.isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  setControlValue: PropTypes.func,
  timeout: PropTypes.number,
  vizType: PropTypes.string.isRequired,
  triggerRender: PropTypes.bool,
  // state
  chartAlert: PropTypes.string,
  chartStatus: PropTypes.string,
  chartStackTrace: PropTypes.string,
  queryResponse: PropTypes.object,
  triggerQuery: PropTypes.bool,
  flashQuery:PropTypes.bool,
  refreshOverlayVisible: PropTypes.bool,
  errorMessage: PropTypes.node,
  // dashboard callbacks
  addFilter: PropTypes.func,
  onQuery: PropTypes.func,
  onFilterMenuOpen: PropTypes.func,
  onFilterMenuClose: PropTypes.func,
};

const BLANK = {};

const defaultProps = {
  addFilter: () => BLANK,
  onFilterMenuOpen: () => BLANK,
  onFilterMenuClose: () => BLANK,
  initialValues: BLANK,
  setControlValue() {},
  triggerRender: false,
  dashboardId: null,
  chartStackTrace: null,
};

class Chart extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handleRenderContainerFailure = this.handleRenderContainerFailure.bind(
      this,
    );
  }

  componentDidMount() {
    if (this.props.triggerQuery) {
      this.runQuery();
    }
  }

  componentDidUpdate() {
    //console.log('chart重新渲染了')
    if (this.props.triggerQuery) {
      //上一次的查询结果
      this.runQuery();
    }
    //console.log('打出参数看看',this.props.flashQuery)
    else if (this.props.flashQuery){
      console.log('连接数加一')
      this.runFlashQuery()
    }
    else{
      if (ALLOW_WebSocket){
      delete_namespaces_socket('chart')
    }
    else{ //清除Timeout的定时器,传入变量名(创建Timeout定时器时定义的变量名)
      console.log('关闭了定时请求')
      clearInterval(this.interval);
     }
    }
  }

  runFlashQuery(){
    if (ALLOW_WebSocket){
    const formData = this.props.formData;
    const dashboardId = this.props.dashboardId;
    const { url, payload } = getExploreUrlAndPayload({
      formData,
      endpointType: 'json',
      force : false,
      allowDomainSharding,
      method: 'POST',
      requestParams: dashboardId ? { dashboard_id: dashboardId } : {},
    });
    //console.log(url,payload)
      if (test_var_socket(payload.slice_id)){
          console.log('socket链接已经存在，不用重新创建一个')
      }
      else {
        creat_namespaces_socket(payload,'chart',this.props.queryResponse,this.props.actions.chartUpdateSucceeded)
      }
 
    }

    else{
  // 下面是短轮询机制
      if(this.props.flashQuery){
        clearInterval(this.interval);//关掉定时器，确保每个定时器打开之前都关闭上一个定时器
        this.interval = setInterval(() => this.
        flashPostChartFromData(
          this.props.formData,
          false,
          this.props.timeout,
          'POST',
          this.props.chartId,
          this.props.dashboardId,
          this.props.queryResponse,
        )
        ,1000)//要加（）=》
        //10s轮询一次
      }
        }
}

 //使用轮询实现图表的刷新
  flashPostChartFromData(
    formData,
    force = false,
    timeout = 60,
    method,
    key,
    dashboardId,
    lastQueryResponse,
  ){
    // console.log('开始查询')
    // console.log('多次dashboardId',dashboardId)
    const { url, payload } = getExploreUrlAndPayload({
        formData,
        endpointType: 'json',
        force,
        allowDomainSharding,
        method,
        requestParams: dashboardId ? { dashboard_id: dashboardId } : {},
      });
    console.log('这是打印的url和payload',url,payload)
    const logStart = Logger.getTimestamp();
    const controller = new AbortController();
    const {signal} = controller;

    let querySettings = {
        url,
        postPayload:{from_data:payload},
        signal,
        timeout: timeout * 1000,
    };
    if (allowDomainSharding) {
        querySettings = {
          ...querySettings,
          mode: 'cors',
          credentials: 'include',
        };
      }

    const clientMethod =
      method === 'GET'&& isFeatureEnabled(FeatureFlag.CLIENT_CACHE)
      ? SupersetClient.get
      : SupersetClient.post;
    const jsonResponse = clientMethod(querySettings)
    .then(({json})=>{
      //console.log('打印的查询结果',json)
      if (JSON.stringify(json.data) == JSON.stringify(lastQueryResponse.data)){
        console.log('与上次查询结果一致，不用刷新chart')
      }
      else{
        console.log('与上次查询结果不一致，刷新chart',json.data,lastQueryResponse.data)
        return this.props.actions.chartUpdateSucceeded(json, key);

      }
    })
    .catch(response => {
      const appendErrorLog = (errorDetails, isCached) => {
          this.props.actions.logEvent('LOG_ACTIONS_LOAD_CHART', {
            slice_id: key,
            has_err: true,
            is_cached: isCached,
            error_details: errorDetails,
            datasource: formData.datasource,
            start_offset: logStart,
            ts: new Date().getTime(),
            duration: Logger.getTimestamp() - logStart,
          });
      };
      //表示连接超时或者链接出错的东西可以保留
      if (response.statusText === 'timeout') {
        clearInterval(this.interval);//关闭定时器
        this.props.actions.flashQuery();//出错关闭定时器开启标志，防止组件更新再打开定时器
        appendErrorLog('timeout');
        return this.props.actions.chartUpdateTimeout(response.statusText, timeout, key)
      } else if (response.name === 'AbortError') {
        clearInterval(this.interval);//关闭定时器
        this.props.actions.flashQuery();//出错关闭定时器开启标志，防止组件更新再打开定时器
        appendErrorLog('abort');
        return this.props.actions.chartUpdateStopped(key);
      }
      return getClientErrorObject(response).then(parsedResponse => {
        // query is processed, but error out.
        clearInterval(this.interval);//关闭定时器
        this.props.actions.flashQuery();//出错关闭定时器开启标志，防止组件更新再打开定时器
        appendErrorLog(parsedResponse.error, parsedResponse.is_cached);
        return this.props.actions.chartUpdateFailed(parsedResponse, key);
      });
    });

        // .then(({json})) => {
        //  if (json.data == lastQueryResponse.data){
        //     return console.log('查询结果没变化，不渲染chart')

        //  }
        // }
     }


  runQuery() {
    if (this.props.chartId > 0 && isFeatureEnabled(FeatureFlag.CLIENT_CACHE)) {
      // Load saved chart with a GET request
      this.props.actions.getSavedChart(
        this.props.formData,
        false,
        this.props.timeout,
        this.props.chartId,
        this.props.dashboardId,
      );
    } else {
      // Create chart with POST request
      this.props.actions.postChartFormData(
        this.props.formData,
        false,
        this.props.timeout,
        this.props.chartId,
        this.props.dashboardId,
      );
    }
  }

  handleRenderContainerFailure(error, info) {
    const { actions, chartId } = this.props;
    console.warn(error); // eslint-disable-line
    actions.chartRenderingFailed(
      error.toString(),
      chartId,
      info ? info.componentStack : null,
    );

    actions.logEvent(LOG_ACTIONS_RENDER_CHART_CONTAINER, {
      slice_id: chartId,
      has_err: true,
      error_details: error.toString(),
      start_offset: this.renderStartTime,
      ts: new Date().getTime(),
      duration: Logger.getTimestamp() - this.renderStartTime,
    });
  }

  renderStackTraceMessage() {
    const { chartAlert, chartStackTrace, queryResponse } = this.props;
    return (
      <StackTraceMessage
        message={chartAlert}
        link={queryResponse ? queryResponse.link : null}
        stackTrace={chartStackTrace}
      />
    );
  }

  render() {
    const {
      width,
      height,
      chartAlert,
      chartStatus,
      errorMessage,
      onQuery,
      refreshOverlayVisible,
    } = this.props;

    const isLoading = chartStatus === 'loading';

    // this allows <Loading /> to be positioned in the middle of the chart
    const containerStyles = isLoading ? { height, width } : null;
    const isFaded = refreshOverlayVisible && !errorMessage;
    this.renderContainerStartTime = Logger.getTimestamp();
    if (chartStatus === 'failed') {
      return this.renderStackTraceMessage();
    }
    if (errorMessage) {
      return <Alert bsStyle="warning">{errorMessage}</Alert>;
    }
    return (
      <ErrorBoundary
        onError={this.handleRenderContainerFailure}
        showMessage={false}
      >
        <div
          className={`chart-container ${isLoading ? 'is-loading' : ''}`}
          style={containerStyles}
        >
          {isLoading && <Loading size={50} />}

          {!isLoading && !chartAlert && isFaded && (
            <RefreshChartOverlay//幹什麽的？
              width={width}
              height={height}
              onQuery={onQuery}
            />
          )}
          <div className={`slice_container ${isFaded ? ' faded' : ''}`}>
            <ChartRenderer {...this.props} />
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

Chart.propTypes = propTypes;
Chart.defaultProps = defaultProps;

export default Chart;



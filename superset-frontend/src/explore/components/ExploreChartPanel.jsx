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
import React from 'react';
import PropTypes from 'prop-types';
import { Panel } from 'react-bootstrap';
import { ParentSize } from '@vx/responsive';
import { chartPropShape } from '../../dashboard/util/propShapes';
import ChartContainer from '../../chart/ChartContainer';
import ExploreChartHeader from './ExploreChartHeader';

const propTypes = {
  actions: PropTypes.object.isRequired,
  addHistory: PropTypes.func,
  onQuery: PropTypes.func,
  can_overwrite: PropTypes.bool.isRequired,
  can_download: PropTypes.bool.isRequired,
  datasource: PropTypes.object,
  column_formats: PropTypes.object,
  containerId: PropTypes.string.isRequired,
  height: PropTypes.string.isRequired,
  width: PropTypes.string.isRequired,
  isStarred: PropTypes.bool.isRequired,
  slice: PropTypes.object,
  table_name: PropTypes.string,
  vizType: PropTypes.string.isRequired,
  form_data: PropTypes.object,
  standalone: PropTypes.bool,
  timeout: PropTypes.number,
  refreshOverlayVisible: PropTypes.bool,
  chart: chartPropShape,
  errorMessage: PropTypes.node,
  triggerRender: PropTypes.bool,
};

class ExploreChartPanel extends React.PureComponent {
  renderChart() {
    const { chart } = this.props;
    //console.log('输出的chart',chart)
    const headerHeight = this.props.standalone ? 0 : 80;
    //console.log('ExploreChartPanel：',chart)
    //console.log('chartpanel获取到的fromdata',this.props.form_data)
    return (
      <ParentSize>
        {({ width, height }) =>
          width > 0 &&
          height > 0 && (
            <ChartContainer
              width={Math.floor(width)}
              height={parseInt(this.props.height, 10) - headerHeight}
              annotationData={chart.annotationData}
              chartAlert={chart.chartAlert}
              chartStackTrace={chart.chartStackTrace}
              chartId={chart.id}
              chartStatus={chart.chartStatus}
              triggerRender={this.props.triggerRender}
              datasource={this.props.datasource}
              errorMessage={this.props.errorMessage}
              formData={this.props.form_data}
              onQuery={this.props.onQuery}
              queryResponse={chart.queryResponse}
              refreshOverlayVisible={this.props.refreshOverlayVisible}
              setControlValue={this.props.actions.setControlValue}
              timeout={this.props.timeout}
              triggerQuery={chart.triggerQuery}
              flashQuery={chart.flashQuery}
              vizType={this.props.vizType}
            />
          )
        }
      </ParentSize>
    );
  }

  render() {
    if (this.props.standalone) {
      // dom manipulation hack to get rid of the boostrap theme's body background
      const standaloneClass = 'background-transparent';
      const bodyClasses = document.body.className.split(' ');
      if (bodyClasses.indexOf(standaloneClass) === -1) {
        document.body.className += ` ${standaloneClass}`;
      }
      return this.renderChart();
    }

    const header = (//表头上面显示的超时之类的东西
      <ExploreChartHeader
        actions={this.props.actions}
        addHistory={this.props.addHistory}
        can_overwrite={this.props.can_overwrite}
        can_download={this.props.can_download}
        isStarred={this.props.isStarred}
        slice={this.props.slice}
        table_name={this.props.table_name}
        form_data={this.props.form_data}
        timeout={this.props.timeout}
        chart={this.props.chart}
      />
    );
    return (
      <div className="chart-container">
        <Panel style={{ height: this.props.height }}>
          <Panel.Heading>{header}</Panel.Heading>
          <Panel.Body>{this.renderChart()}</Panel.Body>
        </Panel>
      </div>
    );
  }
}

ExploreChartPanel.propTypes = propTypes;

export default ExploreChartPanel;

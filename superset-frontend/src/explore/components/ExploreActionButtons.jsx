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

//定义chart页面chart上方绿色时间后面的五个按钮（我们加了一个放大按钮现在是六个了）
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { t } from '@superset-ui/translation';

import URLShortLinkButton from '../../components/URLShortLinkButton';
import EmbedCodeButton from './EmbedCodeButton';
import DisplayQueryButton from './DisplayQueryButton';
import { exportChart, getExploreLongUrl } from '../exploreUtils';
import Amplification from './../../components/Amplification'//引入自己的放大按钮

const propTypes = {
  actions: PropTypes.object.isRequired,
  canDownload: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
    .isRequired,
  chartStatus: PropTypes.string,
  latestQueryFormData: PropTypes.object,
  queryResponse: PropTypes.object,
  slice: PropTypes.object,
};

export default function ExploreActionButtons({
  actions,
  canDownload,
  chartStatus,
  latestQueryFormData,
  queryResponse,
  slice,
}) 
{
  const exportToCSVClasses = cx('btn btn-default btn-sm', {
    'disabled disabledButton': !canDownload,
  });
  const doExportCSV = exportChart.bind(this, latestQueryFormData, 'csv');
  const doExportChart = exportChart.bind(this, latestQueryFormData, 'json');
  const srcLink =
      window.location.origin +
      getExploreLongUrl(latestQueryFormData, 'standalone');//在这里latestQueryFormData已经在function中定义了所以不用this。props调用
  //embedcodeButton下面的两个按钮是。csv和。json两个按钮，分别是用这种形式去显示查询数据
  return (
    <div className="btn-group results" role="group">
      {latestQueryFormData && (
        <URLShortLinkButton
          url={getExploreLongUrl(latestQueryFormData)}
          emailSubject="Superset Chart"
          emailContent="Check out this chart: "
        />
      )}
      
      {latestQueryFormData && (
        <Amplification
          nextUrl = {srcLink}
        />
      )}

      {latestQueryFormData && (
        <EmbedCodeButton latestQueryFormData={latestQueryFormData} />
      )}
      {latestQueryFormData && (
        <a
          onClick={doExportChart}
          className="btn btn-default btn-sm"
          title={t('Export to .json')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa fa-file-code-o" /> .json 
        </a>
      )}
      {latestQueryFormData && (
        <a
          onClick={doExportCSV}
          className={exportToCSVClasses}
          title={t('Export to .csv format')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa fa-file-text-o" /> .csv
        </a>
      )}
      

      <DisplayQueryButton
        queryResponse={queryResponse}
        latestQueryFormData={latestQueryFormData}
        chartStatus={chartStatus}
        onOpenInEditor={actions.redirectSQLLab}
        slice={slice}
      />
    </div>
  );
}

ExploreActionButtons.propTypes = propTypes;

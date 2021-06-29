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
import { hot } from 'react-hot-loader/root';
import { Provider } from 'react-redux';
import ToastPresenter from '../messageToasts/containers/ToastPresenter';
import ExploreViewContainer from './components/ExploreViewContainer';

import setupApp from '../setup/setupApp';
import setupPlugins from '../setup/setupPlugins';
import './main.less';
import '../../stylesheets/reactable-pagination.less';

setupApp();
setupPlugins();
//Provider接受store作为props，然后通过context往下传，这样react中任何组件都可以通过context获取store。
const App = ({ store }) => (
  <Provider store={store}>
    <div>
      <ExploreViewContainer />
      <ToastPresenter />
    </div>
  </Provider>
);
//使用 react 编写代码时，能让修改的部分自动刷新。但这和自动刷新网页是不同的，
//因为 hot-loader 并不会刷新网页，而仅仅是替换你修改的部分，也就是上面所说的 without losing state。
//根据fromdata的改变来热更新前端的组件
export default hot(App);

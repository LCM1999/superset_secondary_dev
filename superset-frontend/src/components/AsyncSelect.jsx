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
import Select from 'react-select';
import { t } from '@superset-ui/translation';
import { SupersetClient } from '@superset-ui/connection';
import getClientErrorObject from '../utils/getClientErrorObject';

const propTypes = {
  dataEndpoint: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  mutator: PropTypes.func.isRequired,
  onAsyncError: PropTypes.func,
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]),
  valueRenderer: PropTypes.func,
  placeholder: PropTypes.string,
  autoSelect: PropTypes.bool,
};

const defaultProps = {
  placeholder: t('Select ...'),
  onAsyncError: () => {},
};

class AsyncSelect extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      options: [],
    };

    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    this.fetchOptions();
  }//在render完以后被调用的函数
  //componentDidMount方法中的代码，是在组件已经完全挂载到网页上才会调用被执行，所以可以保证数据的加载。
  //此外，在这方法中调用setState方法，会触发重渲染。所以，官方设计这个方法就是用来加载外部数据用的，
  //或处理其他的副作用代码。

  onChange(option) {
    this.props.onChange(option);
  }

  fetchOptions() {
    this.setState({ isLoading: true });
    const { mutator, dataEndpoint } = this.props;
    console.log(mutator)
    console.log(dataEndpoint)
    //获取构造的异步GET请求
    return SupersetClient.get({ endpoint: dataEndpoint })
      .then(({ json }) => {
        const options = mutator ? mutator(json) : json;

        this.setState({ options, isLoading: false });
        console.log(json)
        if (!this.props.value && this.props.autoSelect && options.length > 0) {
          this.onChange(options[0]);
        }
      })
      .catch(response =>
        getClientErrorObject(response).then(error => {
          this.props.onAsyncError(error.error || error.statusText || error);
          this.setState({ isLoading: false });
        }),
        
      );
  }

  render() {
     //...this.props表示的是调用者批量传输的元素，在被调用者中统一用this.props来代指
    return (
      <Select
        placeholder={this.props.placeholder}
        options={this.state.options}
        value={this.props.value}
        isLoading={this.state.isLoading}
        onChange={this.onChange}
        valueRenderer={this.props.valueRenderer}
        {...this.props}        
      />     
    );
  }
}

AsyncSelect.propTypes = propTypes;
AsyncSelect.defaultProps = defaultProps;

export default AsyncSelect;

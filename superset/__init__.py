# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
"""Package's main module!"""
from flask import current_app, Flask
from werkzeug.local import LocalProxy

from superset.app import create_app
from superset.connectors.connector_registry import ConnectorRegistry
from superset.extensions import (
    appbuilder,
    cache_manager,
    db,#这个db引用的flask本身的默认SQLA，即它的session连接的是提前在配置文件config.py中写好的数据库连接方式
    event_logger,
    feature_flag_manager,
    jinja_context_manager,
    manifest_processor,
    results_backend_manager,
    security_manager,
    talisman,
)
from superset.security import SupersetSecurityManager
from superset.utils.log import DBEventLogger, get_event_logger_from_cfg_value

#  All of the fields located here should be considered legacy. The correct way
#  to declare "global" dependencies is to define it in extensions.py,
#  then initialize it in app.create_app(). These fields will be removed
#  in subsequent PRs as things are migrated towards the factory pattern
app: Flask = current_app
cache = LocalProxy(lambda: cache_manager.cache)
#它接收一个可调用的无参数函数作为参数，内部实现了object对象所有的魔法方法的重写
#，理论上可以代理任何的对象，不管这个对象的结构是怎么样的。
conf = LocalProxy(lambda: current_app.config)
get_feature_flags = feature_flag_manager.get_feature_flags
get_manifest_files = manifest_processor.get_manifest_files
is_feature_enabled = feature_flag_manager.is_feature_enabled
jinja_base_context = jinja_context_manager.base_context
results_backend = LocalProxy(lambda: results_backend_manager.results_backend)
#匿名函数lambda：是指一类无需定义标识符（函数名）的函数或子程序。 lambda 函数可以接收任意多个参数(包括可选参数) 并且返回单个表达式的值
results_backend_use_msgpack = LocalProxy(
    lambda: results_backend_manager.should_use_msgpack
)
tables_cache = LocalProxy(lambda: cache_manager.tables_cache)

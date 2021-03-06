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

import logging
import os

import wtforms_json
from flask import Flask, redirect
from flask_sockets import Sockets
from flask_appbuilder import expose, IndexView
from flask_babel import gettext as __, lazy_gettext as _
from flask_compress import Compress
from flask_wtf import CSRFProtect

from superset.connectors.connector_registry import ConnectorRegistry
from superset.extensions import (
    _event_logger,
    APP_DIR,
    appbuilder,
    cache_manager,
    celery_app,
    db,
    feature_flag_manager,
    jinja_context_manager,
    manifest_processor,
    migrate,
    results_backend_manager,
    talisman,
)
from superset.security import SupersetSecurityManager
from superset.utils.core import pessimistic_connection_handling
from superset.utils.log import DBEventLogger, get_event_logger_from_cfg_value

logger = logging.getLogger(__name__)


def create_app():

    app = Flask(__name__)
    sockets = Sockets(app)

    #app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)

    try:
        # Allow user to override our config completely
        config_module = os.environ.get("SUPERSET_CONFIG", "superset.config")
        app.config.from_object(config_module)

        app_initializer = app.config.get("APP_INITIALIZER", SupersetAppInitializer)(app)
        app_initializer.init_app()

        from flask_socket.buleview import ws#????????????????????????????????????????????????
        sockets.register_blueprint(ws,url_prefix=r'/')

        return app

    # Make sure that bootstrap errors ALWAYS get logged
    except Exception as ex:
        logger.exception("Failed to create app")
        raise ex


class SupersetIndexView(IndexView):
    @expose("/")
    def index(self):
        return redirect("/superset/welcome")


class SupersetAppInitializer:
    def __init__(self, app: Flask) -> None:
        super().__init__()

        self.flask_app = app
        self.config = app.config
        self.manifest: dict = {}

    def pre_init(self) -> None:
        """
        Called before all other init tasks are complete
        """
        wtforms_json.init()

        if not os.path.exists(self.config["DATA_DIR"]):
            os.makedirs(self.config["DATA_DIR"])

    def post_init(self) -> None:
        """
        Called after any other init tasks
        """
        pass

    def configure_celery(self) -> None:
        celery_app.config_from_object(self.config["CELERY_CONFIG"])
        celery_app.set_default()
        flask_app = self.flask_app

        # Here, we want to ensure that every call into Celery task has an app context
        # setup properly
        task_base = celery_app.Task

        class AppContextTask(task_base):  # type: ignore
            # pylint: disable=too-few-public-methods
            abstract = True

            # Grab each call into the task and set up an app context
            def __call__(self, *args, **kwargs):
                with flask_app.app_context():
                    return task_base.__call__(self, *args, **kwargs)

        celery_app.Task = AppContextTask

    def init_views(self) -> None:
        #
        # We're doing local imports, as several of them import
        # models which in turn try to import
        # the global Flask app
        #
        # pylint: disable=too-many-locals
        # pylint: disable=too-many-statements
        from superset.connectors.druid.views import (
            DruidDatasourceModelView,
            DruidClusterModelView,
            DruidMetricInlineView,
            DruidColumnInlineView,
            Druid,
        )
        from superset.datasets.api import DatasetRestApi
        from superset.connectors.sqla.views import (
            TableColumnInlineView,
            SqlMetricInlineView,
            TableModelView,
            RowLevelSecurityFiltersModelView,
        )
        from superset.views.annotations import (
            AnnotationLayerModelView,
            AnnotationModelView,
        )
        from superset.views.api import Api
        from superset.views.core import (
            AccessRequestsModelView,
            KV,
            R,
            Superset,
            CssTemplateModelView,
            CssTemplateAsyncModelView,
        )
        from superset.charts.api import ChartRestApi
        from superset.views.chart.views import SliceModelView, SliceAsync
        from superset.dashboards.api import DashboardRestApi
        from superset.views.dashboard.views import (
            DashboardModelView,
            Dashboard,
            DashboardModelViewAsync,
        )
        from superset.views.database.api import DatabaseRestApi
        from superset.views.database.views import DatabaseView, CsvToDatabaseView
        from superset.views.datasource import Datasource
        from superset.views.log.api import LogRestApi
        from superset.views.log.views import LogModelView
        from superset.views.schedules import (
            DashboardEmailScheduleView,
            SliceEmailScheduleView,
        )
        from superset.views.sql_lab import (
            QueryView,
            SavedQueryViewApi,
            SavedQueryView,
            TabStateView,
            TableSchemaView,
            SqlLab,
        )
        from superset.views.tags import TagView

        #
        # Setup API views
        #
        appbuilder.add_api(ChartRestApi)
        appbuilder.add_api(DashboardRestApi)
        appbuilder.add_api(DatabaseRestApi)
        appbuilder.add_api(DatasetRestApi)
        #
        # Setup regular views
        #
        appbuilder.add_view(
            AnnotationLayerModelView,
            "Annotation Layers",
            label=__("Annotation Layers"),
            icon="fa-comment",
            category="Manage",
            category_label=__("Manage"),
            category_icon="",
        )
        appbuilder.add_view(
            AnnotationModelView,
            "Annotations",
            label=__("Annotations"),
            icon="fa-comments",
            category="Manage",
            category_label=__("Manage"),
            category_icon="",
        )
        appbuilder.add_view(
            DatabaseView,
            "Databases",
            label=__("Databases"),
            icon="fa-database",
            category="Sources",
            category_label=__("Sources"),
            category_icon="fa-database",
        )
        appbuilder.add_link(
            "Tables",
            label=__("Tables"),
            href="/tablemodelview/list/?_flt_1_is_sqllab_view=y",
            icon="fa-table",
            category="Sources",
            category_label=__("Sources"),
            category_icon="fa-table",
        )
        appbuilder.add_separator("Sources")
        appbuilder.add_view(
            SliceModelView,
            "Charts",
            label=__("Charts"),
            icon="fa-bar-chart",
            category="",
            category_icon="",
        )
        appbuilder.add_view(
            DashboardModelView,
            "Dashboards",
            label=__("Dashboards"),
            icon="fa-dashboard",
            category="",
            category_icon="",
        )
        appbuilder.add_view(
            CssTemplateModelView,
            "CSS Templates",
            label=__("CSS Templates"),
            icon="fa-css3",
            category="Manage",
            category_label=__("Manage"),
            category_icon="",
        )
        appbuilder.add_view(
            QueryView,
            "Queries",
            label=__("Queries"),
            category="Manage",
            category_label=__("Manage"),
            icon="fa-search",
        )
        if self.config["ENABLE_ROW_LEVEL_SECURITY"]:
            appbuilder.add_view(
                RowLevelSecurityFiltersModelView,
                "Row Level Security Filters",
                label=__("Row level security filters"),
                category="Security",
                category_label=__("Security"),
                icon="fa-lock",
            )

        #
        # Setup views with no menu
        #
        appbuilder.add_view_no_menu(Api)
        appbuilder.add_view_no_menu(CssTemplateAsyncModelView)
        appbuilder.add_view_no_menu(CsvToDatabaseView)
        appbuilder.add_view_no_menu(Dashboard)
        appbuilder.add_view_no_menu(DashboardModelViewAsync)
        appbuilder.add_view_no_menu(Datasource)

        if feature_flag_manager.is_feature_enabled("KV_STORE"):
            appbuilder.add_view_no_menu(KV)

        appbuilder.add_view_no_menu(R)
        appbuilder.add_view_no_menu(SavedQueryView)
        appbuilder.add_view_no_menu(SavedQueryViewApi)
        appbuilder.add_view_no_menu(SliceAsync)
        appbuilder.add_view_no_menu(SqlLab)
        appbuilder.add_view_no_menu(SqlMetricInlineView)
        appbuilder.add_view_no_menu(Superset)
        appbuilder.add_view_no_menu(TableColumnInlineView)
        appbuilder.add_view_no_menu(TableModelView)
        appbuilder.add_view_no_menu(TableSchemaView)
        appbuilder.add_view_no_menu(TabStateView)

        if feature_flag_manager.is_feature_enabled("TAGGING_SYSTEM"):
            appbuilder.add_view_no_menu(TagView)

        #
        # Add links
        #
        appbuilder.add_link(
            "Import Dashboards",
            label=__("Import Dashboards"),
            href="/superset/import_dashboards",
            icon="fa-cloud-upload",
            category="Manage",
            category_label=__("Manage"),
            category_icon="fa-wrench",
        )
        appbuilder.add_link(
            "SQL Editor",
            label=_("SQL Editor"),
            href="/superset/sqllab",
            category_icon="fa-flask",
            icon="fa-flask",
            category="SQL Lab",
            category_label=__("SQL Lab"),
        )
        appbuilder.add_link(
            __("Saved Queries"),
            href="/sqllab/my_queries/",
            icon="fa-save",
            category="SQL Lab",
        )
        appbuilder.add_link(
            "Query Search",
            label=_("Query Search"),
            href="/superset/sqllab#search",
            icon="fa-search",
            category_icon="fa-flask",
            category="SQL Lab",
            category_label=__("SQL Lab"),
        )
        appbuilder.add_link(
            "Upload a CSV",
            label=__("Upload a CSV"),
            href="/csvtodatabaseview/form",
            icon="fa-upload",
            category="Sources",
            category_label=__("Sources"),
            category_icon="fa-wrench",
        )

        #
        # Conditionally setup log views
        #
        if self.config["FAB_ADD_SECURITY_VIEWS"] and self.config["SUPERSET_LOG_VIEW"]:
            appbuilder.add_api(LogRestApi)
            appbuilder.add_view(
                LogModelView,
                "Action Log",
                label=__("Action Log"),
                category="Security",
                category_label=__("Security"),
                icon="fa-list-ol",
            )

        #
        # Conditionally setup email views
        #
        if self.config["ENABLE_SCHEDULED_EMAIL_REPORTS"]:
            appbuilder.add_separator("Manage")
            appbuilder.add_view(
                DashboardEmailScheduleView,
                "Dashboard Email Schedules",
                label=__("Dashboard Emails"),
                category="Manage",
                category_label=__("Manage"),
                icon="fa-search",
            )
            appbuilder.add_view(
                SliceEmailScheduleView,
                "Chart Emails",
                label=__("Chart Email Schedules"),
                category="Manage",
                category_label=__("Manage"),
                icon="fa-search",
            )

        #
        # Conditionally add Access Request Model View
        #
        if self.config["ENABLE_ACCESS_REQUEST"]:
            appbuilder.add_view(
                AccessRequestsModelView,
                "Access requests",
                label=__("Access requests"),
                category="Security",
                category_label=__("Security"),
                icon="fa-table",
            )

        #
        # Conditionally setup Druid Views
        #
        if self.config["DRUID_IS_ACTIVE"]:
            appbuilder.add_separator("Sources")
            appbuilder.add_view(
                DruidDatasourceModelView,
                "Druid Datasources",
                label=__("Druid Datasources"),
                category="Sources",
                category_label=__("Sources"),
                icon="fa-cube",
            )
            appbuilder.add_view(
                DruidClusterModelView,
                name="Druid Clusters",
                label=__("Druid Clusters"),
                icon="fa-cubes",
                category="Sources",
                category_label=__("Sources"),
                category_icon="fa-database",
            )
            appbuilder.add_view_no_menu(DruidMetricInlineView)
            appbuilder.add_view_no_menu(DruidColumnInlineView)
            appbuilder.add_view_no_menu(Druid)

            if self.config["DRUID_METADATA_LINKS_ENABLED"]:
                appbuilder.add_link(
                    "Scan New Datasources",
                    label=__("Scan New Datasources"),
                    href="/druid/scan_new_datasources/",
                    category="Sources",
                    category_label=__("Sources"),
                    category_icon="fa-database",
                    icon="fa-refresh",
                )
                appbuilder.add_link(
                    "Refresh Druid Metadata",
                    label=__("Refresh Druid Metadata"),
                    href="/druid/refresh_datasources/",
                    category="Sources",
                    category_label=__("Sources"),
                    category_icon="fa-database",
                    icon="fa-cog",
                )
            appbuilder.add_separator("Sources")

    def init_app_in_ctx(self) -> None:
        """
        Runs init logic in the context of the app
        """
        self.configure_feature_flags()
        self.configure_fab()
        self.configure_url_map_converters()
        self.configure_data_sources()#???????????????????????????????????????

        # Hook that provides administrators a handle on the Flask APP
        # after initialization
        flask_app_mutator = self.config["FLASK_APP_MUTATOR"]
        if flask_app_mutator:
            flask_app_mutator(self.flask_app)

        self.init_views()

    def init_app(self) -> None:
        """
        Main entry point which will delegate to other methods in
        order to fully init the app
        """
        self.pre_init()

        self.setup_db()

        self.configure_celery()

        self.setup_event_logger()

        self.setup_bundle_manifest()

        self.register_blueprints()

        self.configure_wtf()

        self.configure_logging()

        self.configure_middlewares()

        self.configure_cache()

        self.configure_jinja_context()

        with self.flask_app.app_context():
            self.init_app_in_ctx()

        self.post_init()

    def setup_event_logger(self):
        _event_logger["event_logger"] = get_event_logger_from_cfg_value(
            self.flask_app.config.get("EVENT_LOGGER", DBEventLogger())
        )

    def configure_data_sources(self):
        # Registering sources
        module_datasource_map = self.config["DEFAULT_MODULE_DS_MAP"]
        print(module_datasource_map)
        module_datasource_map.update(self.config["ADDITIONAL_MODULE_DS_MAP"])
        ConnectorRegistry.register_sources(module_datasource_map)

    def configure_cache(self):
        cache_manager.init_app(self.flask_app)
        results_backend_manager.init_app(self.flask_app)

    def configure_feature_flags(self):
        feature_flag_manager.init_app(self.flask_app)

    def configure_fab(self):
        if self.config["SILENCE_FAB"]:
            logging.getLogger("flask_appbuilder").setLevel(logging.ERROR)

        custom_sm = self.config["CUSTOM_SECURITY_MANAGER"] or SupersetSecurityManager
        if not issubclass(custom_sm, SupersetSecurityManager):
            raise Exception(
                """Your CUSTOM_SECURITY_MANAGER must now extend SupersetSecurityManager,
                 not FAB's security manager.
                 See [4565] in UPDATING.md"""
            )

        appbuilder.indexview = SupersetIndexView
        appbuilder.base_template = "superset/base.html"
        appbuilder.security_manager_class = custom_sm
        appbuilder.update_perms = False
        appbuilder.init_app(self.flask_app, db.session)

    def configure_url_map_converters(self):
        #
        # Doing local imports here as model importing causes a reference to
        # app.config to be invoked and we need the current_app to have been setup
        #
        from superset.utils.url_map_converters import RegexConverter
        from superset.utils.url_map_converters import ObjectTypeConverter

        self.flask_app.url_map.converters["regex"] = RegexConverter
        self.flask_app.url_map.converters["object_type"] = ObjectTypeConverter

    def configure_jinja_context(self):
        jinja_context_manager.init_app(self.flask_app)

    def configure_middlewares(self):
        if self.config["ENABLE_CORS"]:
            from flask_cors import CORS

            CORS(self.flask_app, **self.config["CORS_OPTIONS"])

        if self.config["ENABLE_PROXY_FIX"]:
            from werkzeug.middleware.proxy_fix import ProxyFix

            self.flask_app.wsgi_app = ProxyFix(
                self.flask_app.wsgi_app, **self.config["PROXY_FIX_CONFIG"]
            )

        if self.config["ENABLE_CHUNK_ENCODING"]:

            class ChunkedEncodingFix:  # pylint: disable=too-few-public-methods
                def __init__(self, app):
                    self.app = app

                def __call__(self, environ, start_response):
                    # Setting wsgi.input_terminated tells werkzeug.wsgi to ignore
                    # content-length and read the stream till the end.
                    if environ.get("HTTP_TRANSFER_ENCODING", "").lower() == "chunked":
                        environ["wsgi.input_terminated"] = True
                    return self.app(environ, start_response)

            self.flask_app.wsgi_app = ChunkedEncodingFix(self.flask_app.wsgi_app)

        if self.config["UPLOAD_FOLDER"]:
            try:
                os.makedirs(self.config["UPLOAD_FOLDER"])
            except OSError:
                pass

        for middleware in self.config["ADDITIONAL_MIDDLEWARE"]:
            self.flask_app.wsgi_app = middleware(self.flask_app.wsgi_app)

        # Flask-Compress
        if self.config["ENABLE_FLASK_COMPRESS"]:
            Compress(self.flask_app)

        if self.config["TALISMAN_ENABLED"]:
            talisman.init_app(self.flask_app, **self.config["TALISMAN_CONFIG"])

    def configure_logging(self):
        self.config["LOGGING_CONFIGURATOR"].configure_logging(
            self.config, self.flask_app.debug
        )

    def setup_db(self):
        db.init_app(self.flask_app)

        with self.flask_app.app_context():
            pessimistic_connection_handling(db.engine)

        migrate.init_app(self.flask_app, db=db, directory=APP_DIR + "/migrations")

    def configure_wtf(self):
        if self.config["WTF_CSRF_ENABLED"]:
            csrf = CSRFProtect(self.flask_app)
            csrf_exempt_list = self.config["WTF_CSRF_EXEMPT_LIST"]
            for ex in csrf_exempt_list:
                csrf.exempt(ex)

    def register_blueprints(self):
        for bp in self.config["BLUEPRINTS"]:
            try:
                logger.info(f"Registering blueprint: '{bp.name}'")
                self.flask_app.register_blueprint(bp)
            except Exception:  # pylint: disable=broad-except
                logger.exception("blueprint registration failed")

    def setup_bundle_manifest(self):
        manifest_processor.init_app(self.flask_app)

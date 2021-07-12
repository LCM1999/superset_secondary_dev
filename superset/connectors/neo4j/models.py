import json
import logging
import re
from collections import OrderedDict
from copy import deepcopy
from datetime import datetime, timedelta
from distutils.version import LooseVersion
from multiprocessing.pool import ThreadPool
from typing import Any, cast, Dict, Iterable, List, Optional, Set, Tuple, Union

import pandas as pd
import sqlalchemy as sa
from dateutil.parser import parse as dparse
from flask import escape, Markup
from flask_appbuilder import Model
from flask_appbuilder.models.decorators import renders
from flask_appbuilder.security.sqla.models import User
from flask_babel import lazy_gettext as _
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import backref, relationship, Session
from sqlalchemy.sql import expression

from superset import conf, db, security_manager
from superset.connectors.base.models import BaseColumn, BaseDatasource, BaseMetric
from superset.constants import NULL_STRING
from superset.exceptions import SupersetException
from superset.extensions import encrypted_field_factory
from superset.models.core import Database
from superset.models.helpers import AuditMixinNullable, ImportExportMixin, QueryResult
from superset.typing import (
    AdhocMetric,
    FilterValues,
    Granularity,
    Metric,
    QueryObjectDict,
)
from superset.utils import core as utils
from superset.utils.date_parser import parse_human_datetime, parse_human_timedelta

class Neo4jDatasource():
    type = "neo4j"
    query_language = "cypher"

    __tablename__ = "netgraphs"
    __tabel_args__ = (UniqueConstraint("database_id", "table_name"),)
    pass
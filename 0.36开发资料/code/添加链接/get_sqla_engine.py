    def get_sqla_engine(
        self,
        schema: Optional[str] = None,
        nullpool: bool = True,
        user_name: Optional[str] = None,
        source: Optional[utils.QuerySource] = None,
    ) -> Engine or Graph :
        extra = self.get_extra()#从基础BaseEngineSpec中拿到连接数据库须要的且由用户输入的额外东西
        sqlalchemy_url = make_url(self.sqlalchemy_uri_decrypted)#给定一个字符串或Unicode实例，生成一个新的URL实例。
        #如果传入图数据库实例是没有database这个字符串被解析出来的
        self.db_engine_spec.adjust_database_uri(sqlalchemy_url, schema)#传入数据库连接模式图数据库这块还没重写
        effective_username = self.get_effective_user(sqlalchemy_url, user_name)
        # If using MySQL or Presto for example, will set url.username
        # If using Hive, will not do anything yet since that relies on a
        # configuration parameter instead.
        self.db_engine_spec.modify_url_for_impersonation(
            sqlalchemy_url, self.impersonate_user, effective_username
        )
        #下面两行是遮盖password后打印url日志
        masked_url = self.get_password_masked_url(sqlalchemy_url)
        logger.debug("Database.get_sqla_engine(). Masked URL: %s", str(masked_url))
        #########中间的这些用不到 ，一般不会填extra这个表单对象
        params = extra.get("engine_params", {})
        if nullpool:
            params["poolclass"] = NullPool

        connect_args = params.get("connect_args", {})
        configuration = connect_args.get("configuration", {})

        # If using Hive, this will set hive.server2.proxy.user=$effective_username
        configuration.update(
            self.db_engine_spec.get_configuration_for_impersonation(
                str(sqlalchemy_url), self.impersonate_user, effective_username
            )
        )
        if configuration:
            connect_args["configuration"] = configuration
            print('执行了')
        if connect_args:
            params["connect_args"] = connect_args
            print('执行了2')

        params.update(self.get_encrypted_extra())
        print(params)
        ##########
        if DB_CONNECTION_MUTATOR:#这个是配置文件中的DB_CONNECTION_MUTATOR字段 是None
            if not source and request and request.referrer:
                if "/superset/dashboard/" in request.referrer:
                    source = utils.QuerySource.DASHBOARD
                elif "/superset/explore/" in request.referrer:
                    source = utils.QuerySource.CHART
                elif "/superset/sqllab/" in request.referrer:
                    source = utils.QuerySource.SQL_LAB

            sqlalchemy_url, params = DB_CONNECTION_MUTATOR(
                sqlalchemy_url, params, effective_username, security_manager, source
            )
            print('执行了3')
        #should import py2neo here
        print(str(sqlalchemy_url))
        if self.database_kind:
            return GraphService(str(sqlalchemy_url))#为了不更改变量名字引起麻烦暂时就继续使用sqlalchemy_url
        else:
            return create_engine(sqlalchemy_url, **params)
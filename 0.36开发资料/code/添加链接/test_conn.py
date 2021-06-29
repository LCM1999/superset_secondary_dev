    @api
    @has_access_api
    @expose("/testconn", methods=["POST", "GET"])
    def testconn(self):
        """Tests a sqla connection"""
        db_name = request.json.get("name")
        uri = request.json.get("uri")
        try:
            if app.config["PREVENT_UNSAFE_DB_CONNECTIONS"]:
                check_sqlalchemy_uri(uri)
            # if the database already exists in the database, only its safe (password-masked) URI
            # would be shown in the UI and would be passed in the form data.
            # so if the database already exists and the form was submitted with the safe URI,
            # we assume we should retrieve the decrypted URI to test the connection.
            if uri.startswith('http'):#图数据库的url形式
                print('是图数据库的链接')
                #匹配数据库中的链接
                database_kind = 1 #代表不是传统的数据库
            else:
                database_kind = 0             
            if db_name:
                existing_database = (
                    db.session.query(models.Database)
                    .filter_by(database_name=db_name)
                    .one_or_none()
                )
                if existing_database and uri == existing_database.safe_sqlalchemy_uri():
                    uri = existing_database.sqlalchemy_uri_decrypted

            # this is the database instance that will be tested
            database = models.Database(
                # extras is sent as json, but required to be a string in the Database model
                server_cert=request.json.get("server_cert"),
                extra=json.dumps(request.json.get("extras", {})),
                impersonate_user=request.json.get("impersonate_user"),
                encrypted_extra=json.dumps(request.json.get("encrypted_extra", {})),
            )
            database.set_sqlalchemy_uri(uri)
            database.db_engine_spec.mutate_db_for_connection_test(database)

            username = g.user.username if g.user is not None else None
            print(username)
            engine = database.get_sqla_engine(user_name=username)
            print(engine)
            if database_kind:
                a = Node("Person", name="Bob")
                print(engine.default_graph.exists(a))#对默认连接做一个检查
                return json_success('"OK"')
                del engine
            else:
                with closing(engine.connect()) as conn:
                    conn.scalar(select([1]))
                    return json_success('"OK"')
        except CertificateException as e:
            logger.info(e.message)
            return json_error_response(e.message)
        except NoSuchModuleError as e:
            logger.info("Invalid driver %s", e)
            driver_name = make_url(uri).drivername
            return json_error_response(
                _(
                    "Could not load database driver: %(driver_name)s",
                    driver_name=driver_name,
                ),
                400,
            )
        except ArgumentError as e:
            logger.info("Invalid URI %s", e)
            return json_error_response(
                _(
                    "Invalid connection string, a valid string usually follows:\n"
                    "'DRIVER://USER:PASSWORD@DB-HOST/DATABASE-NAME'"
                )
            )
        except OperationalError as e:
            logger.warning("Connection failed %s", e)
            return json_error_response(
                _("Connection failed, please check your connection settings."), 400
            )
        except DBSecurityException as e:
            logger.warning("Stopped an unsafe database connection. %s", e)
            return json_error_response(_(str(e)), 400)
        except ClientError as e:
            logger.warning("uername or password wrong. %s", e)
            return json_error_response(_(str(e)), 400)
        except Exception as e:
            logger.error("Unexpected error %s", e)
            return json_error_response(
                _("Unexpected error occurred, please check your logs for details"), 400
            )
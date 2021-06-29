    def set_sqlalchemy_uri(self,uri: str) -> None:#用来遮盖password的
        conn = sqla.engine.url.make_url(uri.strip())#取出url中开头结尾的空格符
        if conn.password != PASSWORD_MASK and not custom_password_store:#是否使用外部存储存储密码而不是放在数据库中此处配置文件中设置的是None
                # do not over-write the password with the password mask
            self.password = conn.password
        conn.password = PASSWORD_MASK if conn.password else None
        self.sqlalchemy_uri = str(conn)  # hides the password
    @property
    def database_kind(self) ->bool:#自己加的方法
        if str(self.sqlalchemy_uri).startswith('http'):#图数据库的url形式
            print('是图数据库')
            database_kind = True #代表不是传统的数据库
        else:
            database_kind = False  
        return database_kind
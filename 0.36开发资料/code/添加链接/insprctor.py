    @property
    def inspector(self) -> Inspector:
        engine = self.get_sqla_engine()
        if self.database_kind :
            print(engine)
            return engine
        else:#不是图数据库就按之前的来    
            print(sqla.inspect(engine))
            return sqla.inspect(engine)
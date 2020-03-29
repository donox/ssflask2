class BaseTableManager(object):
    def __init__(self, db_session):
        self.db_session = db_session
        self.table_field_list = dict()

    def get_table_fields(self, table: str):
        """Get list of fields in a MySQL table.

        Args:
            table: Name of table

        Returns(list): list of table field names

        """
        if table in self.table_field_list:
            return self.table_field_list[table]
        else:
            sql = f'DESCRIBE {table};'
            res = self.db_session.execute(sql)
            fields = [x[0].lower() for x in res.fetchall()]
            self.table_field_list[table] = fields
            return fields

    def get_table_value(self, table):
        fields = self.get_table_fields(table)

        def get_row_values(row_list):

            def get_value(field):
                return row_list[fields.index(field)]
            return get_value
        return get_row_values

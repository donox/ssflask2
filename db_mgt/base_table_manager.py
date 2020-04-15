from utilities.sst_exceptions import RecordUpdateError


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
            sql = f'DESCRIBE {table.lower()};'
            res = self.db_session.execute(sql)
            fields = [x[0].lower() for x in res.fetchall()]
            self.table_field_list[table] = fields
            return fields

    def update_table(self, new_obj, old_obj, table):
        try:
            for column in self.get_table_fields(table):
                if column != 'id':
                    setattr(old_obj, column, getattr(new_obj, column))
            self.db_session.commit()
        except Exception as e:
            raise RecordUpdateError(f'BaseTableManager error trying to update table: {table}')


    def get_table_value(self, table):
        """This is intended to get values for table fields from a database row for populating a structure such as
        a corresponding table object."""
        fields = self.get_table_fields(table)

        def get_row_values(row_list):

            def get_value(field):
                return row_list[fields.index(field)]
            return get_value
        return get_row_values

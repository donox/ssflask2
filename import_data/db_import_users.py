from flask_user.password_manager import PasswordManager as PM
from flask import current_app as app
from db_mgt.db_exec import DBExec
from db_mgt.user_models import UserManager, User


class ImportUserData(object):
    """
    Route: '/admin/sst_import_database' = > db_import_pages
    Template: import_database_functions.jinja2
    Form: import_database_functions_form.py
    Processor: db_import_pages.py
    """
    all_users = 'select * from wp_users;'

    def __init__(self, db_exec: DBExec):
        self.db_session = db_exec.get_db_session()
        self.min_user_id = 12  # User ids less than or equal to this have existing records to keep
        self.user_table_mgr = UserManager(self.db_session)
        self.wp_user_fields = self.user_table_mgr.get_table_fields('wp_users')
        self.user_fields = self.user_table_mgr.get_table_fields('users')
        self.pass_mgr = PM(app)
        self.pswd = self.pass_mgr.hash_password('Sunny')

    def import_users(self):
        sql = f'select {", ".join(self.wp_user_fields)} from wp_users;'
        res = self.db_session.execute(sql)
        for user in res:
            rd = {a: b for a, b in zip(self.wp_user_fields, user)}
            uid = self.user_table_mgr.get_user_id_from_email(rd['user_email'])
            if uid and uid > self.min_user_id:
                self.user_table_mgr.delete_user_by_id(uid)
            if not uid or uid > self.min_user_id:
                new_user = User(username=rd['user_login'], email=rd['user_email'], password=self.pswd)
                new_user.add_to_db(self.db_session, commit=True)


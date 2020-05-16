from wtforms import Form, StringField, IntegerField, BooleanField, SelectField, TextAreaField, SelectMultipleField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from .form_docs.manage_users_doc import docs
from db_mgt.db_exec import DBExec

# Get list of roles from DB for use in selector dropdown.
db_exec = DBExec()
usr_mgr = db_exec.create_user_manager()
user_roles = usr_mgr.get_available_roles()


class ManageUsersForm(FlaskForm):
    """Manage users as sysadmin.
    """
    """
     Route: '/sysadmin/manage_users' => manage_users
     Template: manage_users.jinja2
     Display: display_users.jinja2
     Form: manage_users_form.py
     Processor: manage_users.py
    """
    supported_functions = [('usr_sr', 'Set Roles for a User'),
                           ('usr_del', 'Delete an Existing User'),
                           ('usr_add', 'Add a New User'),
                           ('usr_mod', 'Modify an Existing User')]
    possible_roles = [x for x in zip(user_roles, user_roles)]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "usr_sr usr_del usr_add usr_mod",
                                           "docs": docs['all']['work_function']})
    user_name = StringField(label='User Name', validators=[Optional()],
                            render_kw={"class": "usr_sr usr_del usr_add usr_mod", "docs": docs['usr_sr']['user_name']})
    user_roles = SelectMultipleField(label='User Roles', choices=possible_roles,
                             render_kw={"class": "usr_sr", "docs": docs['usr_sr']['user_roles']})
    user_email = StringField(label='User Email', validators=[Optional()],
                              render_kw={"class": "usr_add usr_mod", "docs": docs['usr_sr']['user_email']})
    user_password = StringField(label='User Password', validators=[Optional()],
                           render_kw={"class": "usr_add usr_mod", "docs": docs['usr_sr']['user_password']})

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data in 'usr_sr usr_del usr_add usr_mod':
            # We don't check database for page
            return True
        elif self.work_function.data == 'df':
            if self.filename.data == '':
                self.errors['page_name'] = ['You must specify the name of the file to be deleted']
            return True
        elif self.work_function.data == 'dp':
            return True
        elif self.work_function.data == 'show_layout':
            return True
        return False
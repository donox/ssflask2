from wtforms import Form, StringField, IntegerField, BooleanField, SelectField, TextAreaField, SelectMultipleField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from ssfl.sysadmin.forms.form_docs.manage_users_doc import docs
from db_mgt.db_exec import DBExec


class SSTLoginForm(FlaskForm):
    """Manage users as sysadmin.
    """
    """
     Route: '/sysadmin/manage_users' => manage_users
     Template: manage_users.jinja2
     Display: display_users.jinja2
     Form: manage_users_form.py
     Processor: manage_users.py
    """
    supported_functions = [('log_usr', 'Log User In'),
                           ('log_xxx', 'Delete an Existing User'),
                           ('log_xxx', 'Add a New User'),
                           ('log_xxx', 'Modify an Existing User')]
    work_function = SelectField(label='Select Function', choices=supported_functions)
                                # render_kw={"id": "js1", "class": "usr_sr usr_del usr_add usr_mod",
                                #            "docs": docs['all']['work_function']})
    user_name = StringField(label='User Name', validators=[Optional()])
                            # render_kw={"class": "usr_sr usr_del usr_add usr_mod", "docs": docs['usr_sr']['user_name']})
    # user_roles = SelectMultipleField(label='User Roles', choices=possible_roles,
    #                          render_kw={"class": "usr_sr", "docs": docs['usr_sr']['user_roles']})
    # user_email = StringField(label='User Email', validators=[Optional()],
    #                           render_kw={"class": "usr_add usr_mod", "docs": docs['usr_sr']['user_email']})
    # user_password = StringField(label='User Password', validators=[Optional()],
    #                        render_kw={"class": "usr_add usr_mod", "docs": docs['usr_sr']['user_password']})

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data in 'log_usr log_xxx':
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
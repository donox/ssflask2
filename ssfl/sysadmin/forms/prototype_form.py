from wtforms import Form, StringField, IntegerField, BooleanField, SelectField, TextAreaField, SelectMultipleField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from ssfl.sysadmin.forms.form_docs.manage_users_doc import docs
from db_mgt.db_exec import DBExec


class PrototypeForm(FlaskForm):
    """Use this a a base for creating a new Form.
    """
    """
    -----------Duplicate these references in each file to assist remembering what is where.
     Route: '/sysadmin/manage_users' => manage_users
     Template: manage_users.jinja2
     Display: display_users.jinja2
     Form: manage_users_form.py
     Processor: manage_users.py
    """
    # Supported functions lists the commands that will show in the work_function dropdown
    supported_functions = [('abc_def', 'Visible Command as Seen By User'),
                           ('abc_xxx', 'Delete an Existing User'),
                           ('abc_xxx', 'Add a New User'),
                           ('abc_xxx', 'Modify an Existing User')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "abc_def abc_xxx abc_xxx abc_xxx",
                                           "docs": docs['all']['work_function']})
    some_field = StringField(label='User Name', validators=[Optional()],
                             render_kw={"class": "usr_sr usr_del usr_add usr_mod",
                                        "docs": docs['abc_def']['user_name']})
    # Add fields as needed

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data in 'abc_def abc_xxx':
            #  Dummy that avoids validate during first tests of package
            return True
        elif self.work_function.data == 'abc_xxx':
            if self.filename.data == '':
                self.errors['field_name'] = [f'Relevant Error message: ....']
            return True
        return False

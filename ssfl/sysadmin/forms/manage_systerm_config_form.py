from wtforms import Form, StringField, IntegerField, BooleanField, SelectField, TextAreaField, SelectMultipleField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from ssfl.sysadmin.forms.form_docs.manage_system_config_doc import docs
from db_mgt.db_exec import DBExec


class ManageSystemConfigurationForm(FlaskForm):
    """Manage JSON System Configuration values.
    """
    """
     Route: '/sysadmin/manage_system_configuration' => manage_system_config_commands
     Template: manage_system_configuration.jinja2
     Form: manage_system_configuration_form.py
     Processor: manage_system_config_commands.py
    """
    # Supported functions lists the commands that will show in the work_function dropdown
    supported_functions = [('sys_main', 'Update Main Page Configuration'),
                           ('abc_xxx', 'Delete an Existing User'),
                           ('abc_xxx', 'Add a New User'),
                           ('abc_xxx', 'Modify an Existing User')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "sys_main abc_xxx abc_xxx abc_xxx",
                                           "docs": docs['all']['work_function']})
    template_name = StringField(label='JSON Template Defining Graph', validators=[Optional()],
                             render_kw={"class": "sys_main usr_del usr_add usr_mod",
                                        "docs": docs['sys_main']['template_name']})
    new_main_page = StringField(label='JSON Template defining new main page', validators=[Optional()],
                                render_kw={"class": "sys_main usr_del usr_add usr_mod",
                                           "docs": docs['sys_main']['new_main_page']})
    # Add fields as needed

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data in 'sys_main abc_xxx':
            #  Dummy that avoids validate during first tests of package
            return True
        elif self.work_function.data == 'abc_xxx':
            if self.filename.data == '':
                self.errors['field_name'] = [f'Relevant Error message: ....']
            return True
        return False

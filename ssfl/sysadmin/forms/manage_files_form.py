from wtforms import Form, StringField, IntegerField, BooleanField, SelectField, TextAreaField, SelectMultipleField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from ssfl.sysadmin.forms.form_docs.manage_users_doc import docs
from db_mgt.db_exec import DBExec


class ManageFilesForm(FlaskForm):
    """Manage Files stored in directories on the system
    """
    """
    -----------Duplicate these references in each file to assist remembering what is where.
     Route: '/sysadmin/manage_files' => manage_files_commands
     Template: manage_files.jinja2
     Display: display_manage_files.jinja2
     Form: manage_files_form.py
     Processor: manage_files_commands.py
    """
    supported_functions = [('mf_disp', 'Display Files in Directory'),
                           ('mf_xxx', 'Delete an Existing User'),
                           ('mf_xxx', 'Add a New User'),
                           ('mf_xxx', 'Modify an Existing User')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "mf_disp abc_xxx abc_xxx abc_xxx",
                                           "docs": docs['all']['work_function']})
    file_directory_choices = [('downloads', 'downloads'),
                              ('gen_pages', 'gen_pages'),
                              ('plots', 'plots'),
                              ('definition_files', 'definition_files'),
                              ('uploads', 'uploads'),
                              ('photo_uploads', 'photo_uploads')]

    file_directory = SelectField(label='Select Function', choices=file_directory_choices,
                                render_kw={"class": "mf_disp abc_xxx abc_xxx abc_xxx",
                                           "docs": docs['all']['work_function']})
    # some_field = StringField(label='User Name', validators=[Optional()],
    #                          render_kw={"class": "usr_sr usr_del usr_add usr_mod",
    #                                     "docs": docs['abc_def']['user_name']})

    # Add fields as needed

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data in 'mf_disp mf_disp':
            #  Dummy that avoids validate during first tests of package
            return True
        elif self.work_function.data == 'mf_xxx':
            if self.filename.data == '':
                self.errors['field_name'] = [f'Relevant Error message: ....']
            return True
        return False

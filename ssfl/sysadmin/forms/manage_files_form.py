from wtforms import Form, StringField, IntegerField, SelectField, TextAreaField, SelectMultipleField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from flask_wtf.file import FileField
from config import Config
from ssfl.sysadmin.forms.form_docs.manage_files_doc import docs
from db_mgt.db_exec import DBExec


class ManageFilesForm(FlaskForm):
    """Manage Files stored in directories on the system
    """
    """
     Route: '/sysadmin/manage_files' => manage_files_commands
     Template: manage_files.jinja2
     Display: display_manage_files.jinja2
     Form: manage_files_form.py
     Processor: manage_files_commands.py
    """
    roles_by_file_type = {'downloads': set(['User', 'Admin', 'SysAdmin']),
                          'gen_pages': set(['SysAdmin']),
                          'definition_files': set(['SysAdmin']),
                          'uploads': set(['SysAdmin']),
                          'photo_uploads': set(['Admin', 'SysAdmin']),
                          'plots': set(['User', 'Admin', 'SysAdmin']),
                          }
    supported_functions = [('mf_disp', 'Display Files in Directory'),
                           ('mf_upld', 'Upload File to Directory'),
                           ('mf_xxx', 'Add a New User'),
                           ('mf_xxx', 'Modify an Existing User')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "mf_disp mf_upld abc_xxx abc_xxx",
                                           "docs": docs['all']['work_function']})
    file_directory_choices = [('downloads', 'downloads'),
                              ('gen_pages', 'gen_pages'),
                              ('plots', 'plots'),
                              ('definition_files', 'definition_files'),
                              ('uploads', 'uploads'),
                              ('photo_uploads', 'photo_uploads')]

    file_directory = SelectField(label='Select Directory to Use', choices=file_directory_choices,
                                 render_kw={"class": "mf_disp mf_upld abc_xxx abc_xxx",
                                            "docs": docs['all']['file_directory']})
    upload_file = FileField('Select File to Be Uploaded', validators=[Optional()],
                            render_kw={"class": "mf_upld abc_xxx abc_xxx abc_xxx",
                                       "docs": docs['all']['upload_file']})

    file_name = StringField(label='File Name in Upload Directory', validators=[Optional()],
                            render_kw={"class": "mf_upld abc_xxx abc_xxx abc_xxx",
                                       "docs": docs['all']['file_name']})


    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        user_mgr = db_exec.create_user_manager()
        user = user_mgr.get_current_user()
        user_roles = set(user_mgr.get_user_roles(user.id))
        if not user_roles.intersection(self.roles_by_file_type[self.file_directory.data]):
            self.errors['file_directory'] = [f'You do not have sufficient privileges to perform that operation']
            return False
        if self.work_function.data in 'mf_disp mf_upld':
            #  Dummy that avoids validate during first tests of package
            return True
        elif self.work_function.data == 'mf_xxx':
            if self.filename.data == '':
                self.errors['field_name'] = [f'Relevant Error message: ....']
            return True
        self.errors['work_function'] = [f'Validation failed to find a validating clause.']
        return False

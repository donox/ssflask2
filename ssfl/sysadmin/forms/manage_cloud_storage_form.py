from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from ssfl.admin.forms.form_docs.miscellaneous_functions_doc import docs


class ManageCloudStorageForm(FlaskForm):
    """Support for access to cloud storage (Google Drive).

    """
    """
     Route: '/admin/cloud' => manage_cloud_storage
     Template: cloud.jinja2
     Form: manage_cloud_storage_form.py
     Processor: manage_cloud_storage.py
    """
    supported_functions = [('cl_ls', 'List Files in Directory'),
                           ('cl_df', 'Download File'),
                           ('df', 'Delete File'),
                           ('show_layout', 'Make Layout Model')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "cl_ls cl_df df show_layout",
                                           "docs": docs['all']['work_function']})
    directory_path = StringField(label='Google Drive Directory', validators=[Optional()],
                           render_kw={"class": "cl_ls cl_df", "docs": docs['df']['filename']})
    save_directory = StringField(label='Directory to Save Result', validators=[Optional()],
                                 render_kw={"class": "cl_ls cl_df", "docs": docs['df']['filename']})
    filename = StringField(label='File Name', validators=[Optional()],
                           render_kw={"class": "cl_df", "docs": docs['df']['filename']})

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data == 'cl_ls' and self.directory_path.data:
            return True
        elif self.work_function.data == 'cl_ls' and not self.directory_path.data:
            self.errors['directory_path'] = ['You must specify a directory path']
            return False
        elif self.work_function.data == 'cl_df':
            if self.directory_path.data and self.save_directory.data and self.filename.data:
                return True
        return False

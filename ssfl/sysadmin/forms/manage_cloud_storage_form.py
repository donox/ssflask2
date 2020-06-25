from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from ssfl.sysadmin.forms.form_docs.manage_cloud_storage_doc import docs


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
                           ('cl_mr', 'Find Most Recent Backup'),
                           ('cl_df', 'Download File'),
                           ('cl_db', 'Download Entire Backup (SLOW)'),
                           ('xxx', 'xxxxx')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "cl_ls cl_df cl_mr show_layout",
                                           "docs": docs['all']['work_function']})
    directory_path = StringField(label='Google Drive Directory', validators=[Optional()],
                                 render_kw={"class": "cl_ls cl_df", "docs": docs['all']['directory_path']})
    save_directory = StringField(label='Directory to Save Result', validators=[Optional()],
                                 render_kw={"class": "cl_df cl_db", "docs": docs['all']['save_directory']})
    filename = StringField(label='File Name', validators=[Optional()],
                           render_kw={"class": "cl_df", "docs": docs['all']['filename']})
    db_only = BooleanField(label='Download Database Only', default=False,
                           render_kw={"class": "cl_db", "docs": docs['all']['db_only']})
    install_backup = BooleanField(label='Install backup', default=False,
                           render_kw={"class": "cl_db", "docs": docs['all']['install_backup']})

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
        elif self.work_function.data == 'cl_db':
            if self.save_directory.data:
                if self.install_backup and self.db_only:
                    self.errors['db_only'] = ['Specifying database_ONLY and install_backup is inconsistent']
                return True
        elif self.work_function.data == 'cl_mr':
            return True
        self.errors['work_function'] = ['Unable to validate choices (validation failed to capture specific problem)']
        return False

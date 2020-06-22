from wtforms import Form, StringField, PasswordField, validators, FileField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config


class ImportDatabaseFunctionsForm(FlaskForm):
    """Functions to import data from wp db to flask db.

    """
    """
     Route: '/admin/sst_import_database' => db_import_pages
     Template: import_database_functions.jinja2
     Form: import_database_functions_form.py
     Processor: db_import_pages.py
    """
    supported_functions = [('import_pages', 'Import Pages'),
                           ('import_photos', 'Import Photo Tables'),
                           ('import_users', 'Import Users'),
                           ('load_photo_files', 'Update Photo Files'),
                           ]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions,
                                render_kw={"id": "js1"})
    page_name = StringField(label='Page Name', validators=[Optional()])
    filename = StringField(label='File Name', validators=[Optional()])
    local_gallery_folder = StringField(label='Path to Local Copy of Gallery', validators=[Optional()])

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data == 'import_pages':
            # We don't check database for page
            return True
        elif self.work_function.data == 'import_photos':
            return True
        elif self.work_function.data == 'import_users':
            return True
        elif self.work_function.data == 'load_photo_files':
            if not self.local_gallery_folder.data:
                self.errors['local_gallery_folder', 'You must select a folder with all photos to upload']
                return False
            return True
        self.errors['work_function'] = ['Unrecognized function to perform']
        return False

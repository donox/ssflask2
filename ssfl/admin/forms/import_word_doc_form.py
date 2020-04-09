from wtforms import Form, StringField,  SubmitField, BooleanField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
from flask_wtf.file import FileField, FileRequired, FileStorage

from flask_wtf import FlaskForm
from flask import flash
from db_mgt.page_tables import Page
from db_mgt.db_exec import DBExec


class ImportMSWordDocForm(FlaskForm):
    """Upload Word Doc, convert and add to database.

    """
    """
     Route: '/admin/sst_import_page' => import_word_docx
     Template: import_docx.jinja2
     Form: import_docx_form.py
     Processor: import_word_docx.py
    """
    file_name = FileField('Word Document')
    page_name = StringField('Page Name', validators=[Optional()])
    overwrite = BooleanField('Overwrite Existing Page', default=True)
    author = StringField(label='Author', default='Not Available')       # Extract from document if it exists
    submit = SubmitField('Import Document')

    def validate_on_submit(self, db_exec: DBExec):
        page_mgr = db_exec.create_page_manager()
        res = super().validate_on_submit()
        file_storage = self.file_name.data
        file = file_storage.filename
        if not self.overwrite:
            res = page_mgr.get_page_if_exists(None, self.page_name)
            if res:
                flash(u'Specified page already exists in database, overwrite not specified.')
                self.errors['page_name'] = ['Specified page already exists, no overwrite allowed.']
                res = False
        return res

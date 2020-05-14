from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from .form_docs.miscellaneous_functions_doc import docs


class MiscellaneousFunctionsForm(FlaskForm):
    """Miscellaneous functions before revising interface.

    """
    """
     Route: '/admin/sst_miscellaneous' => miscellaneous_functions
     Template: miscellaneous_functions.jinja2
     Form: manage_photos_form.py
     Processor: upload_photos.py
    """
    supported_functions = [('dpdb', 'Delete Page from Database'),
                           ('dp', 'Download Page Directory'),
                           ('df', 'Delete File'),
                           ('show_layout', 'Make Layout Model')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "dpdb dp df show_layout",
                                           "docs": docs['all']['work_function']})
    page_name = StringField(label='Page Name', validators=[Optional()],
                            render_kw={"class": "dpdb dp show_layout", "docs": docs['dp']['page_name']})
    filename = StringField(label='File Name', validators=[Optional()],
                           render_kw={"class": "df", "docs": docs['df']['filename']})
    remove_text = BooleanField(label='Remove Text for Layout', default=False,
                               render_kw={"class": "show_layout", "docs": docs['show_layout']['remove_text']})

    def validate_on_submit(self):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data == 'dpdb':
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

from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config


class MiscellaneousFunctionsForm(FlaskForm):
    """Miscellaneous functions before revising interface.

    """
    """
     Route: '/admin/sst_miscellaneous' => miscellaneous_functions
     Template: miscellaneous_functions.jinja2
     Form: miscellaneous_functions_form.py
     Processor: miscellaneous_functions.py
    """
    supported_functions = [('dpdb', 'Delete Page from Database'),
                           ('dp', 'Download Page Directory'),
                           ('df', 'Delete File')]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions,
                                render_kw={"id": "js1"})
    page_name = StringField(label='Page Name', validators=[Optional()])
    filename = StringField(label='File Name', validators=[Optional()])

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
        return False

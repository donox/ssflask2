from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm


class ImportMSWordForm(FlaskForm):
    """Edit database content."""

    file_name = StringField('Word Document', validators=[DataRequired()])
    directory = StringField('Directory', validators=[DataRequired()], default=os.path.abspath(os.getcwd()))
    page_name = StringField('Page Name', validators=[Optional()])
    overwrite = BooleanField('Overwrite Existing Page', default=True)

    submit = SubmitField('Save to File')

    def validate_on_submit(self):
        res = super().validate_on_submit()
        title = self.page_name
        if self.page_name.data and not self.overwrite:
            self.errors['Page Exists'] = ['Page already exists, no overwrite specified.']
            res = False
        direct = self.directory
        if not os.path.exists(direct.data) or os.path.isfile(direct.data):
            self.errors['File Directory'] = ['Specified directory does not exist']
            res = False
        return res

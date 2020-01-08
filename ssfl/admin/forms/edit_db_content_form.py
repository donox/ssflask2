from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm


class DBContentEditForm(FlaskForm):
    """Edit database content."""

    page_id = IntegerField('Page DB ID', validators=[Optional()])
    page_name = StringField('Page Name', validators=[Optional()])
    directory = StringField('Directory', validators=[DataRequired()], default=os.path.abspath(os.getcwd()))
    file_name = StringField('Save File Name', validators=[DataRequired()])

    submit = SubmitField('Save to File')

    def validate_on_submit(self):
        res = super().validate_on_submit()
        page = self.page_id
        title = self.page_name
        if page.data is None and title.data == '':
            self.errors['Title or Page'] = ['Must specify at least one of a page_id or page_name']
            res = False
        direct = self.directory
        if not os.path.exists(direct.data) or os.path.isfile(direct.data):
            self.errors['File Directory'] = ['Specified directory does not exist']
            res = False
        return res

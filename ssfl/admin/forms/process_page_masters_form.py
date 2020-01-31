from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config


class TranslateDocxToPageForm(FlaskForm):
    supported_functions = [('db', 'Add Page to Database'), ('dpdb', 'Delete Page from Database'),
                           ('df', 'Delete File from Page Masters')]
    """Support uploading files, managing their directory and adding/removing from database."""
    work_function = SelectField(label='Select Function',
                                choices=supported_functions)
    page_title = StringField(label='Page Title', validators=[Optional()])
    page_name = StringField(label='Page Name', validators=[Optional()])
    filename = StringField(label='File Name for Page', validators=[Optional()])
    new_page = BooleanField(label='Is This a New Page ', default=True)
    author = StringField(label='Author', validators=[Optional()])

    def validate_on_submit(self):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data == 'db':
            if self.author.data == '':
                self.errors['Author'] = ['Must specify an author when adding to database']
                return False
            if self.page_name.data == '':
                self.errors['Page Name'] = ['Must specify a name (form: xx-ee-ff-ss) to add to database']
            filepath = os.path.join(Config.USER_PAGE_MASTERS, self.filename.data) + '.docx'
            title = self.page_title
            if title.data == '':        # Page invalid if already in DB?  extension not docx if UploadPage
                self.errors['Title'] = ['Must specify a title for new page']
                return False
            if not os.path.isfile(filepath):
                self.errors['File Exists'] = ['Specified file does not exist']
                return False
            return True
        elif self.work_function.data == 'dpdb':
            # We don't check database for page
            return True
        elif self.work_function.data == 'df':
            if self.filename.data == '':
                self.errors['Page Name'] = ['Must specify the name of the file to be deleted']
            return True
        return False

from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config


class ManageIndexPagesForm(FlaskForm):
    supported_functions = [('cip', 'CreateIndexPage'), ('aii', 'AddIndexItem'),
                           ('xx', 'xx')]
    """Support operations for creating, modifying, deleting index pages and items."""
    work_function = SelectField(label='Select Function',
                                choices=supported_functions)
    page_title = StringField(label='Page Title', validators=[Optional()])
    page_name = StringField(label='Page Name', validators=[DataRequired()])

    # id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # item_name = db.Column(db.String(length=128), nullable=True)
    # item_index_page = db.Column(db.ForeignKey('index_page.id'), nullable=True)
    # button_name = db.Column(db.String(length=128), nullable=False)
    # button_page_url = db.Column(db.ForeignKey('page.id'), nullable=True)  # one of url's must exist to work
    # button_url_link = db.Column(db.String(length=256), nullable=True)
    # item_content = db.Column(db.String(length=1024), nullable=True)
    # item_date = db.Column(db.DateTime, default='2000-01-01')
    # sequence = db.Column(db.Integer, default=0)

    def validate_on_submit(self):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data == 'cip':
            # if self.author.data == '':
            #     self.errors['Author'] = ['Must specify an author when adding to database']
            #     return False
            return True
        elif self.work_function.data == 'aii':
            # We don't check database for page
            return True
        elif self.work_function.data == 'xx':
            if True:
                self.errors['xxxxx'] = ['Must xxxxxxxxxxxxxxxxxxxx']
                return False
            return True
        return False
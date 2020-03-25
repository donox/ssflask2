from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config


class ManageIndexPagesForm(FlaskForm):
    """
     Route: '/admin/manage_index_page' => manage_index_pages
     Template: manage_index_pages.jinja2
     Form: manage_index_pages_form.py
     Processor: manage_index_pages.py
    """
    supported_functions = [('cip', 'CreateIndexPage'), ('aii', 'AddIndexItem'),
                           ('xx', 'xx')]
    """Support operations for creating, modifying, deleting index pages and items."""
    work_function = SelectField(label='Select Function',
                                choices=supported_functions, render_kw={"id": "js1"})
    # Index Page Content
    page_title = StringField(label='Page Title', validators=[Optional()], render_kw={"class": "cip"})
    page_name = StringField(label='Page Name', validators=[DataRequired()], render_kw={"class": "cip"})
    page_content = StringField(label='Page Content', validators=[Optional()], render_kw={"class": "cip"})
    # Index Item Content
    item_name = StringField(label='Item Name', validators=[Optional()], render_kw={"class": "aii"})
    button_name = StringField(label='Button Name', validators=[Optional()], render_kw={"class": "aii"})
    button_page_name = StringField(label='Button Page Name', validators=[Optional()], render_kw={"class": "aii"})
    button_url_link = StringField(label='Button URL', validators=[Optional()], render_kw={"class": "aii"})
    item_content = StringField(label='Item Content', validators=[Optional()], render_kw={"class": "aii"})
    item_sequence_nbr = IntegerField(label='Sequence Number', validators=[Optional()], render_kw={"class": "aii"})

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
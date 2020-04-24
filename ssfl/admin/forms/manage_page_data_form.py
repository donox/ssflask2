from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from .form_docs.manage_page_data_doc import docs


class DBManagePages(FlaskForm):
    """Miscellaneous functions for retrieving and reporting data from the database.

    """
    """
     Route: '/admin/manage_page_data' => manage_page_data
     Template: manage_page_data.jinja2
     Display:  display_page_data.jinja2
     Form: manage_page_data_form.py
     Processor: manage_page_data.py
    """
    supported_functions = [('mpd_recent', 'Show Most Recent Pages'),
                           ('mpd_search', 'Recent Pages by Field, Search'),
                           ('mpd_photo', 'Search for Photos')]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions, render_kw={"id": "js1"})
    search_string = StringField('Search String', validators=[Optional()],
                                render_kw={"class": "mpd_search mpd_photo",
                                           "docs": docs['mpd_search']['search_string']})
    search_field = StringField('Field to Search', validators=[DataRequired()],
                               render_kw={"class": "mpd_search mpd_photo", "docs": docs['mpd_search']['search_field']})
    folder_search = StringField('Field to Search', validators=[Optional()],
                                render_kw={"class": "mpd_photo xxx", "docs": docs['mpd_photo']['folder_search']})

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data == 'mpd_recent':
            # We don't check database for page
            return True
        elif self.work_function.data == 'mpd_search':
            return True
        elif self.work_function.data == 'mpd_photo':
            return True
        return False

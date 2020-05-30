from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from .form_docs.get_databasae_data_doc import docs


class DBGetDatabaseData(FlaskForm):
    """Miscellaneous functions for retrieving and reporting data from the database.

    """
    """
     Route: '/admin/manage_page_data' => manage_page_data
     Template: db_get_database_data.jinja2
     Display:  db_display_database_data.jinja2
     Form: get_database_data_form.py
     Processor: db_get_database_data.py
    """
    supported_functions = [('mpd_recent', 'Show Most Recent Pages'),
                           ('mpd_search', 'Recent Pages by Field, Search'),
                           ('mpd_photo', 'Search for Photos'),
                           ('mpd_photo_csv', 'Make CSV Spreadsheet of Photo Data'),
                           ('mpd_page_csv', 'Make CSV Spreadsheet of Page Data')]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions, render_kw={"id": "js1"})
    search_string = StringField('Search String', validators=[Optional()],
                                render_kw={"class": "mpd_search mpd_photo",
                                           "docs": docs['mpd_search']['search_string']})
    search_field = StringField('Field to Search', validators=[Optional()],
                               render_kw={"class": "mpd_search mpd_photo", "docs": docs['mpd_search']['search_field']})
    folder_search = StringField('Field to Search', validators=[Optional()],
                                render_kw={"class": "mpd_photo xxx", "docs": docs['mpd_photo']['folder_search']})
    verify_element = BooleanField('Verify That Page or Photo Will Load', default=False,
                                  render_kw={"class": "mpd_photo_csv mpd_page_csv",
                                             "docs": docs['mpd_photo']['verify_element']})

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data == 'mpd_recent':
            # We don't check database for page
            return True
        elif self.work_function.data == 'mpd_search':
            if not self.search_string.data or not self.search_field.data:
                self.errors['search_string'] = ['Must specify both a search field and search string']
                return False
            return True
        elif self.work_function.data == 'mpd_photo':
            if not self.search_string.data and not self.folder_search.data:
                self.errors['search_string'] = ['Must specify either a string to search on photos or folders.']
            return True
        elif self.work_function.data in ['mpd_photo_csv', 'mpd_page_csv']:
            return True
        return False

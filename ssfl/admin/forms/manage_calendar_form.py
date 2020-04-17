from wtforms import Form, StringField, SubmitField, IntegerField, FileField, SelectMultipleField, DateTimeField, \
    SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
import datetime as dt
from .form_docs.manage_calendar_doc import docs


class ManageCalendarForm(FlaskForm):
    """Manage Calendar content."""
    """
     Route: '/admin/calendar' => manage_calendar
     Template: calendar.jinja2
     Form: manage_calendar_form.py
     Processor: manage_calendar.py
    """
    work_function = SelectField(label='Select Function',
                                choices=[('c_pr', 'Print Calendar'),
                                         ('c_csv', 'Get  Events from CSV'), ('c_json', 'Get  Events from JSON'),
                                         ('c_new', 'Initialize Calendar'), ('c_del', 'Delete Events')],
                                render_kw={"id": "js1", "class": "c_pr c_csv c_json c_new",
                                           "docs": docs['all']['work_function']})
    file_name = FileField('CSV or JSON Events file',
                          render_kw={"class": "c_csv c_json", "docs": docs['c_csv']['file_name']})
    audiences = SelectMultipleField(label='Select Audiences', choices=[('IL', 'IL'), ('AL', 'AL'), ('HC', 'HC')],
                                    render_kw={"class": "c_pr", "docs": docs['c_pr']['audiences']})
    categories = \
        SelectMultipleField(label='Select Categories',
                            choices=[('Wellness', 'Wellness'), ('Event', 'Event'), ('Religion', 'Religion'),
                                     ('Resident Clubs', 'Resident Clubs')],
                            render_kw={"class": "c_pr", "docs": docs['c_pr']['categories']})
    start_datetime = DateTimeField('Start Date/Time', default=dt.datetime.now().date(),
                                   render_kw={"class": "c_pr", "docs": docs['c_pr']['start_datetime']})
    end_datetime = DateTimeField('End Date/Time', default=dt.datetime.now().date(),
                                 render_kw={"class": "c_pr", "docs": docs['c_pr']['end_datetime']})
    save_file_name = StringField('Save File Name', validators=[Optional()],
                                 render_kw={"class": "c_pr", "docs": docs['c_pr']['save_file_name']})
    submit = SubmitField('Save to File')

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        work_to_do = self.work_function
        start = self.start_datetime
        done = self.end_datetime
        return res

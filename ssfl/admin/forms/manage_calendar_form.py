from wtforms import Form, StringField, SubmitField, IntegerField, FileField, SelectMultipleField, DateTimeField, \
    SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
import datetime as dt


class ManageCalendarForm(FlaskForm):
    """Manage Calendar content."""
    work_function = SelectField(label='Select Function',
                                choices=[('c_pr', 'Print Calendar'),
                                         ('c_csv', 'Get  Events from CSV'), ('c_json', 'Get  Events from JSON'),
                                         ('init', 'Initialize Calendar'), ('c_del', 'Delete Events')])
    file_name = FileField('CSV or JSON file with Events')
    audiences = SelectMultipleField(label='Select Audiences', choices=[('IL', 'IL'), ('AL', 'AL'), ('HC', 'HC')])
    categories = \
        SelectMultipleField(label='Select Categories',
                            choices=[('Wellness', 'Wellness'), ('Event', 'Event'), ('Religion', 'Religion'),
                                     ('Resident Clubs', 'Resident Clubs')])
    start_datetime = DateTimeField('Start Date/Time', default=dt.datetime.now().date())
    end_datetime = DateTimeField('End Date/Time', default=dt.datetime.now().date())
    save_file_name = StringField('Save File Name', validators=[Optional()])

    submit = SubmitField('Save to File')

    def validate_on_submit(self):
        res = super().validate_on_submit()
        work_to_do = self.work_function
        start = self.start_datetime
        done = self.end_datetime
        return res



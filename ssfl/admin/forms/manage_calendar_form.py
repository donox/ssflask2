from wtforms import Form, StringField, SubmitField, IntegerField, BooleanField, SelectMultipleField, DateTimeField, \
    SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
import datetime as dt


class ManageCalendarForm(FlaskForm):
    """Manage Calendar content."""
    work_function = SelectField(label='Select Function',
                                choices=[('uc', 'Upload Calendar'), ('pc', 'Print Calendar'),
                                         ('init', 'Initialize Calendar'), ('ds', 'Do Something Else')])
    audiences = SelectMultipleField(label='Select Audiences', choices=[('IL', 'IL'), ('AL', 'AL'), ('HC', 'HC')])
    categories = \
        SelectMultipleField(label='Select Categories',
                            choices=[('Wellness', 'Wellness'), ('Event', 'Event'), ('Religion', 'Religion'),
                                     ('Resident Clubs', 'Resident Clubs')])
    start_datetime = DateTimeField('Start Date/Time', default=dt.datetime.now().date())
    end_datetime = DateTimeField('End Date/Time', default=dt.datetime.now().date())
    page_id = IntegerField('Page DB ID', validators=[Optional()])
    page_name = StringField('Page Name', validators=[Optional()])
    directory = StringField('Directory', validators=[DataRequired()], default=os.path.abspath(os.getcwd()))
    file_name = StringField('Save File Name', validators=[DataRequired()])

    submit = SubmitField('Save to File')

    def validate_on_submit(self):
        res = super().validate_on_submit()
        work_to_do = self.work_function
        start = self.start_datetime
        done = self.end_datetime
        if not os.path.exists(self.directory.data) or os.path.isfile(self.directory.data):
            self.errors['Directory'] = ['Specified directory does not exist']
            res = False
        file = self.directory.data + '/' + self.file_name.data
        if not os.path.exists(file) or not os.path.isfile(file):
            self.errors['File'] = ['Specified file does not exist']
            res = False
        if not self.file_name.data.endswith('.csv'):
            self.errors['File'] = ['Specified file is not of type "csv"']
            res = False
        return res

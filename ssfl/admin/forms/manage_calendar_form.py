from wtforms import Form, StringField, SubmitField, IntegerField, BooleanField, SelectMultipleField, DateTimeField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
import datetime as dt


class DBManageCalendarForm(FlaskForm):
    """Manage Calendar content."""

    work_function = SelectField(label='Select Function', choices=[('pc', 'Print Calendar'),('ds', 'Do Something')])
    start_datetime = DateTimeField('Start Date/Time',  default=dt.datetime.now().date())
    end_datetime = DateTimeField('End Date/Time', default=dt.datetime.now().date())
    page_id = IntegerField('Page DB ID', validators=[Optional()])
    page_name = StringField('Page Name', validators=[Optional()])
    directory = StringField('Directory', validators=[DataRequired()], default=os.path.abspath(os.getcwd()))
    file_name = StringField('Save File Name', validators=[DataRequired()])
    direction = BooleanField('Transfer to file', default=True)

    submit = SubmitField('Save to File')

    def validate_on_submit(self):
        res = super().validate_on_submit()
        work_to_do = self.work_function
        start = self.start_datetime
        done = self.end_datetime
        direct = self.directory
        if not os.path.exists(direct.data) or os.path.isfile(direct.data):
            self.errors['File Directory'] = ['Specified directory does not exist']
            res = False
        return res

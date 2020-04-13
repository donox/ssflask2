from wtforms import Form, StringField, validators, SubmitField, IntegerField, BooleanField, SelectField, DateField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from datetime import datetime as dt
from datetime import timedelta as td


class ManagePhotosForm(FlaskForm):
    """Miscellaneous functions before revising interface.

    """
    """
     Route: 'photo/manage_photos' => manage_photos
     Template: photo/manage_photos.jinja2
     Form: photo/manage_photos_form.py
     Processor: photo/manage_photos.py
    """
    supported_functions = [('ph_tml', 'Get Metadata to Edit'),
                           ('ph_xx', 'Net Yet Implemented'),
                           ('ph_yy', 'Net Yet Implemented')]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions,
                                render_kw={"id": "js1"})
    folder = StringField('Gallery/Folder', validators=[Optional()],
                         render_kw={"class": "ph_tml"})
    early_date = DateField(label='Earliest Date', validators=[Optional()],
                           render_kw={"class": "ph_tml"})
    latest_date = DateField(label='Latest Date', default=(dt.now() + td(days=1)).date(),
                            render_kw={"class": "ph_tml"})
    download_filename = StringField('File Name to Download Metadata', validators=[Optional()],
                                    render_kw={"class": "ph_tml"})

    def validate_on_submit(self):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data == 'ph_tml':
            return True
        elif self.work_function.data == 'ph_xx':
            return True
        elif self.work_function.data == 'ph_yy':
            return True
        return False

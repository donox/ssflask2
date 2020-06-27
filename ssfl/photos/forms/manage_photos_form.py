from wtforms import Form, StringField, validators, SubmitField, IntegerField, BooleanField, SelectField, DateField, \
    FileField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from datetime import datetime as dt
from datetime import timedelta as td
from .form_docs.manage_photos_doc import docs


class ManagePhotosForm(FlaskForm):
    """Miscellaneous functions before revising interface.

    """
    """
     Route: 'photo/manage_photos' => manage_photos
     Template: photo/manage_photos.jinja2
     Form: photo/manage_photos_form.py
     Processor: photo/manage_photos.py
    """
    supported_functions = [('xx', '**Select a function**'),
                           ('ph_tml', 'Get Photo Metadata to Edit'),
                           ('ph_up', 'Upload Edited Photo Metadata'),
                           ('ph_ngg', 'Set WP Photo URL')]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions,
                                render_kw={"id": "js1", "docs": docs['all']['ph_all']})
    folder = StringField('Gallery/Folder', validators=[Optional()],
                         render_kw={"class": "ph_tml ph_up", "docs": docs['all']['folder']})
    early_date = DateField(label='Earliest Date', validators=[Optional()],
                           render_kw={"class": "ph_tml", "docs": docs['all']['early_date']})
    latest_date = DateField(label='Latest Date', default=(dt.now() + td(days=1)).date(),
                            render_kw={"class": "ph_tml", "docs": docs['all']['latest_date']})
    download_filename = StringField('Metadata DownloadFile Name', validators=[Optional()],
                                    render_kw={"class": "ph_tml", "docs": docs['all']['download_filename']})
    upload_filename = FileField('Metadata Upload File Name', validators=[Optional()],
                                render_kw={"class": "ph_up", "docs": docs['all']['upload_filename']})
    wp_url = StringField('Wordpress Photo Filename', validators=[Optional()],
                         render_kw={"class": "ph_ngg", "docs": docs['all']['wp_url']})
    wp_photo_id = IntegerField('Wordpress Photo ID', validators=[Optional()],
                               render_kw={"class": "ph_ngg", "docs": docs['all']['wp_photo_id']})
    sst_photo_slug = StringField('New System Photo Slug', validators=[Optional()],
                         render_kw={"class": "ph_ngg", "docs": docs['all']['sst_photo_slug']})

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data == 'ph_tml':
            return True
        elif self.work_function.data == 'ph_up':
            return True
        elif self.work_function.data == 'ph_yy':
            return True
        elif self.work_function.data == 'ph_ngg':
            if not self.wp_url.data:
                self.errors['wp_url'] = ['Must specify filename for Wordpress Photo']
                return False
            elif not self.wp_url.data:
                self.errors['wp_photo_id'] = ['Must specify ID for Wordpress Photo']
                return False
            elif not self.sst_photo_slug.data:
                self.errors['sst_photo_slug'] = ['Must specify Slug for photo in new system']
                return False
            return True
        return False

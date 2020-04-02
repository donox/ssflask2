from wtforms import StringField, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from .form_docs.manage_photo_doc import docs


class DBPhotoManageForm(FlaskForm):
    """Edit or import database content."""
    """
     Route: '/admin/manage_photos' => manage_photo_functions
     Template: manage_photos.jinja2
     Form: manage_photo_functions_form.py
     Processor: manage_photo_functions.py
    """


    supported_functions = [('p_show', 'Create/Edit Slideshow and Snippet'),
                           ('jup', 'Upload JSON to Database'),
                           ('jcsv', 'Create JSON descriptor for Story'),
                           ('jreset', 'Reset DB JSON Prototypes'),
                           ]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions, render_kw={"id": "js1"})
    slideshow_id = IntegerField('JSON DB ID', validators=[Optional()],
                                render_kw={"class": "p_show xxx sss", "docs": docs['p_show']['slideshow_id']})
    slideshow_name = StringField('JSON Template Name', validators=[Optional()],
                                 render_kw={"class": "p_show xxx sss", "docs": docs['p_show']['slideshow_name']})
    slide_list = StringField('Photos in show', validators=[Optional()],
                             render_kw={"class": "p_show xxx sss", "docs": docs['p_show']['slide_list']})
    show_title = StringField('Slideshow Title', validators=[Optional()],
                             render_kw={"class": "p_show xxx sss", "docs": docs['p_show']['slideshow_title']})
    show_text = StringField('Slideshow Text', validators=[Optional()],
                            render_kw={"class": "p_show xxx sss", "docs": docs['p_show']['slideshow_text']})
    slide_frame_height = IntegerField('Height of Slide Frame', validators=[Optional()],
                                      render_kw={"class": "p_show xxx sss",
                                                 "docs": docs['p_show']['slide_frame_height']})
    slide_frame_width = IntegerField('Width of Slide Frame', validators=[Optional()],
                                     render_kw={"class": "p_show xxx sss", "docs": docs['p_show']['slide_frame_width']})
    slide_change = IntegerField('Rate of Slide Changes', validators=[Optional()],
                                render_kw={"class": "p_show xxx sss", "docs": docs['p_show']['slide_change']})
    slide_alignment = StringField('Frame Alignment', validators=[Optional()],
                                   render_kw={"class": "p_show xxx sss", "docs": docs['p_show']['slide_alignment']})
    submit = SubmitField('Submit')

from wtforms import StringField, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm

# id = db.Column(db.Integer, primary_key=True, autoincrement=True)
# name = db.Column(db.String(), nullable=False, unique=True)
# active = db.Column(db.Boolean(), default=True)
# last_update = db.Column(db.DateTime, default='2000-01-01')
# content = db.Column(db.String(), nullable=True)
# status = db.Column(db.String(32), nullable=False)

class DBJSONManageTemplatesForm(FlaskForm):
    """Make Story JSON and add to JSONStore

    """
    supported_functions = [('jcreate', 'Create New JSON DB entry'),
                           ('jedit', 'Edit Story JSON'),
                           ('jpage', 'Edit Page JSON'),
                           ('jdelete', 'Remove existing JSON entry'),
                           ]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions, render_kw={"id": "js1"})
    json_id = IntegerField('JSON DB ID', validators=[Optional()])
    json_name = StringField('JSON Template Name', validators=[Optional()])
    template_content = StringField('Name of JSON Template to Expand as Content', validators=[Optional()])
    is_prototype = BooleanField('Template is prototype', default=False)
    compress = BooleanField('Remove excess whitespace and newlines?', default=False)
    story_template = StringField('JSON Template to Complete', validators=[Optional()])
    story_slug = StringField('Slug for story to process', validators=[Optional()])
    story_author = StringField('Story Author (optional)', validators=[Optional()])
    story_title = StringField('Story Title (optional)', validators=[Optional()])
    snippet_picture_id = IntegerField('ID for photo for story snippet', validators=[Optional()])
    snip_pic_height = IntegerField('Photo height in pixels', validators=[Optional()])
    snip_pic_width = IntegerField('Photo width in pixels', validators=[Optional()])
    snip_pic_position = SelectField(label='Select Function', choices=['left', 'center', 'right'])
    page_slot = IntegerField('Slot on page for snippet', validators=[Optional()])
    page_template = StringField('JSON Template for page layout', validators=[Optional()])
    page_story_template = StringField('JSON Template of story to insert', validators=[Optional()])
    page_width = IntegerField('Width of story display (in pixels)', validators=[Optional()])
    submit = SubmitField('Submit')

    def validate_on_submit(self):
        res = super().validate_on_submit()
        if self.work_function.data == 'jcreate':
            if self.json_name.data == '':
                self.errors['JSON Name'] = ['Must specify name for new DB Entry']
                res = False
            if self.template_content.data == '':
                self.errors['JSON Template'] = ['Must specify template for new DB Entry']
                res = False

        return res

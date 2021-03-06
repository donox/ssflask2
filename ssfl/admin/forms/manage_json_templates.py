from wtforms import StringField, SubmitField, IntegerField, BooleanField, SelectField, FileField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from .form_docs.manage_json_templates_doc import docs


# id = db.Column(db.Integer, primary_key=True, autoincrement=True)
# name = db.Column(db.String(), nullable=False, unique=True)
# active = db.Column(db.Boolean(), default=True)
# last_update = db.Column(db.DateTime, default='2000-01-01')
# content = db.Column(db.String(), nullable=True)
# status = db.Column(db.String(32), nullable=False)

class DBJSONManageTemplatesForm(FlaskForm):
    """Make Story JSON and add to JSONStore

    """
    """ 
     Route: '/admin/manageTemplate' => make_story_json_template
     Template: json_make_template.jinja2
     Form: db_manage_templates_form.py
     Processor: manage_json_template.py
    """
    supported_functions = [('jtomldn', 'Download as TOML'),
                           ('jtomlup', 'Upload TOML file'),
                           ('jdisplay', 'Display JSON Templates'),
                           ('jedit', 'Edit Story JSON'),
                           ('jcal', 'Edit Calendar JSON'),
                           ('jpage', 'Edit Page JSON'),
                           ('jcreate', 'Create New JSON DB entry'),
                           ('jdelete', 'Remove existing JSON entry'),
                           ('jreload', 'Reload DB Prototype Templates'),
                           ]
    picture_alignment_positions = [('left', 'Align Left'),
                                   ('center', 'Align Center'),
                                   ('right', 'Align Right'),
                                   ]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions, render_kw={"id": "js1"})
    json_id = IntegerField('JSON DB ID', validators=[Optional()],
                           render_kw={"class": "jcreate jtomldn jtomlup jedit jcal jdelete", "docs": docs['all']['id']})
    json_name = StringField('JSON Template Name', validators=[Optional()],
                            render_kw={"class": "jcreate jtomldn jtomlup jtoml jedit jcal jdelete",
                                       "docs": docs['all']['name']})
    template_content = StringField('Name of JSON Template to Expand as Content', validators=[Optional()],
                                   render_kw={"class": "jcreate jedit", "docs": docs['jcreate']['template_content']})
    is_prototype = BooleanField('Template is prototype', default=False,
                                render_kw={"class": "jcreate", "docs": docs['jcreate']['prototype']})
    compress = BooleanField('Remove excess whitespace and newlines?', default=False,
                            render_kw={"class": "jcreate", "docs": docs['jcreate']['compress']})

    story_template = StringField('JSON Template to Complete', validators=[Optional()],
                                 render_kw={"class": "jedit", "docs": docs['jedit']['story_template']})
    story_slug = StringField('Slug for story to process', validators=[Optional()],
                             render_kw={"class": "jedit", "docs": docs['jedit']['story_slug']})
    story_author = StringField('Story Author (optional)', validators=[Optional()],
                               render_kw={"class": "jedit", "docs": docs['jedit']['story_author']})
    story_title = StringField('Story Title (optional)', validators=[Optional()],
                              render_kw={"class": "jedit", "docs": docs['jedit']['story_title']})
    snippet_picture_id = IntegerField('ID for photo for story snippet', validators=[Optional()],
                                      render_kw={"class": "jedit", "docs": docs['jedit']['snippet_picture_id']})

    cal_template = StringField('JSON Template for Calendar', validators=[Optional()],
                               render_kw={"class": "jcal", "docs": docs['jcal']['cal_template']})
    # cal_result_template = StringField('JSON Template to Create', validators=[Optional()], render_kw={"class": "jcal"})
    cal_display_count = IntegerField('Number of events to display', validators=[Optional()],
                                     render_kw={"class": "jcal", "docs": docs['jcal']['cal_display_count']}, default=6)
    cal_width = IntegerField('Number of columns in display', validators=[Optional()],
                             render_kw={"class": "jcal", "docs": docs['jcal']['cal_width']}, default=4)

    # TODO:  Either remove or use the snip values - not currently set
    snip_pic_height = IntegerField('Photo height in pixels', validators=[Optional()], render_kw={"class": "jedit"})
    snip_pic_width = IntegerField('Photo width in pixels', validators=[Optional()], render_kw={"class": "jedit"})
    snip_pic_position = SelectField(label='Select Function', choices=picture_alignment_positions, default='left',
                                    render_kw={"class": "jedit"})
    page_slot = IntegerField('Slot on page for snippet', validators=[Optional()],
                             render_kw={"class": "jpage", "docs": docs['jpage']['page_slot']})
    page_template = StringField('JSON Template for page layout', validators=[Optional()],
                                render_kw={"class": "jpage", "docs": docs['jpage']['page_template']})
    page_content_template = StringField('JSON Template of snippet to insert', validators=[Optional()],
                                        render_kw={"class": "jpage", "docs": docs['jpage']['page_content_template']})
    page_width = IntegerField('Width of snippet display (in pixels)', validators=[Optional()],
                              render_kw={"class": "jpage", "docs": docs['jpage']['page_width']})
    toml_file_name = FileField('File Name', validators=[Optional()],
                               render_kw={"class": "jtomlup", "docs": docs['jtomlup']['file_name']})
    toml_overwrite = BooleanField('Overwrite Existing Template', default=False,
                                  render_kw={"class": "jtomlup", "docs": docs['jtomlup']['overwrite']})
    toml_download_name = StringField('File name for TOML Result', validators=[Optional()],
                                     render_kw={"class": "jpage jtomldn", "docs": docs['jtomldn']['out_file']})

    submit = SubmitField('Submit')

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if self.work_function.data == 'jcreate':
            if self.json_name.data == '':
                self.errors['JSON Name'] = ['Must specify name for new DB Entry']
                res = False
            if self.template_content.data == '':
                self.errors['JSON Template'] = ['Must specify template for new DB Entry']
                res = False

        return res

from wtforms import StringField, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from .form_docs.edit_db_json_content_doc import docs


# id = db.Column(db.Integer, primary_key=True, autoincrement=True)
# name = db.Column(db.String(), nullable=False, unique=True)
# active = db.Column(db.Boolean(), default=True)
# last_update = db.Column(db.DateTime, default='2000-01-01')
# content = db.Column(db.String(), nullable=True)
# status = db.Column(db.String(32), nullable=False)

class DBJSONEditForm(FlaskForm):
    """Edit or import database content."""
    """
     Route: '/admin/json' => edit_json_file
     Template: json_edit.jinja2
     Form: edit_json_content_form.py
     Processor: edit_json_file.py
    """

    supported_functions = [('jdown', 'Download JSON from Database'),
                           ('jup', 'Upload JSON to Database'),
                           ('jcsv', 'Create JSON descriptor for Story'),
                           ('jreset', 'Reset DB JSON Prototypes'),
                           ]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions, render_kw={"id": "js1", "class": "jdown jup jcsv jreset",
                                                                        "docs": docs['all']})
    json_id = IntegerField('JSON DB ID', validators=[Optional()],
                           render_kw={"class": "jdown jup jcsv", "docs": docs['json']['json_id']})
    json_name = StringField('JSON Template Name', validators=[Optional()],
                            render_kw={"class": "jdown jup jcsv", "docs": docs['json']['json_name']})
    directory = StringField('Directory', validators=[DataRequired()], default=os.path.abspath(os.getcwd()),
                            render_kw={"class": "jdown jup jcsv"})
    file_name = StringField('File Name', validators=[DataRequired()],
                            render_kw={"class": "jdown jup jcsv", "docs": docs['file']['file_name']})
    file_type = StringField('File Type for Input', default='json', render_kw={"class": "jup jcsv"})
    is_prototype = BooleanField('Save as a PROTOTYPE?', default=False, render_kw={"class": "jup", "docs": docs['proto']['is_prototype']})
    compress = BooleanField('Remove excess whitespace and newlines?', default=False,
                            render_kw={"class": "jup jcsv", "docs": docs['proto']['compress']})
    submit = SubmitField('Submit')

    def validate_on_submit(self):
        res = super().validate_on_submit()
        page = self.json_id
        name = self.json_name
        if page.data is None and name.data == '':
            self.errors['JSON Name'] = ['Must specify at least name']
            res = False
        direct = self.directory
        if not os.path.exists(direct.data) or os.path.isfile(direct.data):
            self.errors['File Directory'] = ['Specified directory does not exist']
            res = False
        return res

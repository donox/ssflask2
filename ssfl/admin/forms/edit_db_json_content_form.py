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

class DBJSONEditForm(FlaskForm):
    """Edit or import database content."""

    supported_functions = [('jdown', 'Download JSON from Database'),
                           ('jup', 'Upload JSON to Database'),
                           ('jcsv', 'Create JSON descriptor for Story'),
                           ('jreset', 'Reset DB JSON Prototypes'),
                           ]
    work_function = SelectField(label='Select Function',
                                choices=supported_functions)
    json_id = IntegerField('JSON DB ID', validators=[Optional()])
    json_name = StringField('JSON Template Name', validators=[Optional()])
    directory = StringField('Directory', validators=[DataRequired()], default=os.path.abspath(os.getcwd()))
    file_name = StringField('Save File Name', validators=[DataRequired()])
    file_type = StringField('File Type for Input', default='csv')
    submit = SubmitField('Save to File')

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

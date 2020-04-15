from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, FileField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from .form_docs.edit import docs
from db_mgt.db_exec import DBExec


class DBContentEditForm(FlaskForm):
    """Edit database content."""

    page_id = IntegerField('Page DB ID', validators=[Optional()],
                           render_kw={"class": "edit", "docs": docs['edit']['page_id']})
    page_name = StringField('Page Name', validators=[Optional()],
                            render_kw={"class": "edit", "docs": docs['edit']['page_name']})
    file_name = StringField('Name for Downloaded File', validators=[Optional()],
                            render_kw={"class": "edit", "docs": docs['edit']['file_name']})
    upload_file = FileField('Select File to Be Uploaded', validators=[Optional()],
                            render_kw={"class": "edit", "docs": docs['edit']['upload_file']})
    direction = BooleanField('Transfer Direction (download=checked)', default=True,
                             render_kw={"class": "edit", "docs": docs['edit']['direction']})

    submit = SubmitField('Save to File')

    def validate_on_submit(self, db_exec: DBExec):
        res = super().validate_on_submit()
        page = self.page_id
        title = self.page_name
        if page.data is None and title.data == '':
            self.errors['Title or Page'] = ['Must specify at least one of a page_id or page_name']
            res = False
        direct = self.direction
        return res

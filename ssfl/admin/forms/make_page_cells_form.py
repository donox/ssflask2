from wtforms import Form, StringField, PasswordField, validators, SubmitField, IntegerField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from .form_docs.make_page_cells_doc import docs


class MakePageCells(FlaskForm):
    """Controls to support creation of page cells.

    """
    """
     Route: '/admin/make_page_cells' => make_page_cells
     Template: make_page_cells.jinja2
     Form: make_page_cells_form.py
     Processor: make_page_cells.py
    """
    supported_functions = [('pl_cal', 'Make Calendar Cell'),
                           ('pl_not', 'Make Notice Cell'),
                           ('pl_sty', 'Make Story Cell'),
                           ('show_layout', 'Make Layout Model')]
    notice_types = [('quote', 'Quote'),
                    ('alert', 'Alert')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "pl_cal pl_not pl_sty show_layout",
                                           "docs": docs['all']['work_function']})
    slug = StringField(label='Descriptor Slug', validators=[Optional()],
                       render_kw={"class": "pl_cal pl_sty", "docs": docs['all']['slug']})
    notice_text = StringField(label='Notice Text', validators=[Optional()],
                              render_kw={"class": "pl_not", "docs": docs['all']['notice_text']})
    notice_type = SelectField(label='Select Notice Type', choices=notice_types,
                              render_kw={"class": "pl_not pl_xxx",
                                         "docs": docs['all']['notice_type']})
    story_slug = StringField(label='Story Slug', validators=[Optional()],
                       render_kw={"class": "pl_sty", "docs": docs['all']['story_slug']})
    xxx = BooleanField(label='Remove Text for Layout', default=False,
                       render_kw={"class": "show_layout", "docs": docs['show_layout']['remove_text']})

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data in ['pl_cal', 'pl_not', 'pl_sty']:
            return True
        elif self.work_function.data == 'pl_not':
            return True
        return False

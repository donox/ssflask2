from wtforms import Form, StringField, SubmitField, IntegerField, BooleanField, SelectField, TextAreaField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from .form_docs.manage_admin_reports_doc import docs


class ManageAdminReportsForm(FlaskForm):
    """Admin Reports Handling

    """
    """
    Route: '/admin/make_report' => manage_admin_reports
    Template: make_report.jinja2
    Form: manage_admin_reports_form.py
    Processor: manage_admin_reports.py
    """
    supported_functions = [('ar_report', 'Make New Report'),
                           ('xx', 'YYY'),
                           ('xx', 'YYY')]
    entry_types = [('problem', 'Problem'),
                   ('ui', 'Look and Feel'),
                   ('suggestion', 'Suggestion'),
                   ('idea', 'Idea to Consider'),
                   ('report', 'Report')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "ar_report xx xx",
                                           "docs": docs['all']['work_function']})
    entry_type = SelectField(label='Type of Entry', choices=entry_types,
                             render_kw={"class": "ar_report xx", "docs": docs['report']['entry_type']})
    content = TextAreaField(label='Report Content',
                            render_kw={"class": "form-control ar_report xx", "docs": docs['report']['content'],
                                       "rows": 5})

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data == 'ar_report':
            # We don't check database for page
            return True
        return False

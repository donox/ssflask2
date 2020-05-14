from wtforms import Form, StringField, validators, SubmitField, IntegerField, BooleanField, SelectField, TextAreaField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
import os
from utilities.sst_exceptions import DataEditingSystemError
from flask_wtf import FlaskForm
from config import Config
from .form_docs.manage_groups_doc import docs


class ManageGroupsForm(FlaskForm):
    """Manage groups as sysadmin.
    """
    """
     Route: '/sysadmin/manage_groups' => manage_groups
     Template: manage_groups.jinja2
     Form: manage_groups_form.py
     Processor: manage_groups.py
    """
    supported_functions = [('gr_cg', 'Create a New Group'),
                           ('gr_del', 'Delete an Existing Group'),
                           ('gr_am', 'Add a Member to an Existing Group'),
                           ('gr_rm', 'Remove a Member from an Existing Group'),
                           ('gr_lg', 'List Existing Groups'),
                           ('gr_lm', 'List Members of an Existing Group')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "gr_cg gr_del gr_am gr_rm gr_lg gr_lm",
                                           "docs": docs['all']['work_function']})
    group_name = StringField(label='Group Name', validators=[Optional()],
                            render_kw={"class": "gr_cg gr_del gr_am gr_rm gr_lm", "docs": docs['gn']['group_name']})
    group_owner = StringField(label='Group Owner', validators=[Optional()],
                             render_kw={"class": "gr_cg gr_del", "docs": docs['go']['owner']})
    group_purpose = TextAreaField(label='Group Purpose', validators=[Optional()],
                              render_kw={"class": "gr_cg", "docs": docs['gp']['group_purpose']})
    member_name = StringField(label='Member Name', validators=[Optional()],
                           render_kw={"class": "gr_am gr_rm", "docs": docs['mn']['member_name']})

    def validate_on_submit(self, db_exec):
        res = super().validate_on_submit()
        if not res:
            return False
        if self.work_function.data in 'gr_cg gr_del gr_am gr_rm gr_lg gr_lm':
            # We don't check database for page
            return True
        elif self.work_function.data == 'df':
            if self.filename.data == '':
                self.errors['page_name'] = ['You must specify the name of the file to be deleted']
            return True
        elif self.work_function.data == 'dp':
            return True
        elif self.work_function.data == 'show_layout':
            return True
        return False
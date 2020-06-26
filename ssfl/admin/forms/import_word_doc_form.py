from wtforms import Form, StringField, SubmitField, BooleanField, SelectField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, Length, Optional
from flask_wtf.file import FileField, FileRequired, FileStorage

from flask_wtf import FlaskForm
from flask import flash
from db_mgt.page_tables import Page
from db_mgt.db_exec import DBExec
from .form_docs.import_word_doc_doc import docs


class ImportMSWordDocForm(FlaskForm):
    """Upload Word Doc, convert and add to database.

    """
    """
     Route: '/admin/sst_import_page' => import_word_docx
     Template: import_docx.jinja2
     Form: import_docx_form.py
     Processor: import_word_docx.py
    """
    supported_functions = [('docx_new_page', 'Make New SsT.org Page'),
                           ('docx_wp_page', 'Make Wordpress Page'),
                           ('xx', 'YYY')]
    work_function = SelectField(label='Select Function', choices=supported_functions,
                                render_kw={"id": "js1", "class": "docx_new_page docx_wp_page xx",
                                           "docs": docs['all']['work_function']})
    file_name = FileField('Word Document', render_kw={"class": "docx_new_page docx_wp_page",
                                                      "docs": docs['import']['file_name']})
    page_name = StringField('Page Name', validators=[Optional()],
                            render_kw={"class": "docx_new_page", "docs": docs['import']['page_name']})
    overwrite = BooleanField('Overwrite Existing Page', default=True,
                             render_kw={"class": "docx_new_page", "docs": docs['import']['overwrite']})
    wordpress_file = StringField(label='File for Wordpress output', validators=[Optional()],
                                 render_kw={"class": "docx_wp_page", "docs": docs['import']['wordpress_file']})
    submit = SubmitField('Import Document')

    def validate_on_submit(self, db_exec: DBExec):
        page_mgr = db_exec.create_page_manager()
        res = super().validate_on_submit()
        file_storage = self.file_name.data
        page_name = self.page_name.data
        if not page_name:
            flash(u'You must  specify a page name')
            self.errors['page_name'] = ['No page name specified.']
            return False
        if not self.overwrite:
            res = page_mgr.get_page_if_exists(None, self.page_name)
            if res:
                flash(u'Specified page already exists in database, overwrite not specified.')
                self.errors['page_name'] = ['Specified page already exists, no overwrite allowed.']
                res = False
        return res

import os

from config import Config
from db_mgt.page_tables import Page, PageManager
from utilities.miscellaneous import get_temp_file_name
import datetime as dt
from process_word_sources.process_word_source import WordSourceDocument
from ssfl import sst_syslog
import csv


def import_docx_and_add_to_db(db_session, form, filename):
    """Import docx file to html and add to database"""
    """
     Route: '/admin/sst_import_page' => import_word_docx
     Template: import_docx.jinja2
     Form: import_docx_form.py
     Processor: import_word_docx.py
    """
    page_title = 'Default Title'
    page_name = form.page_name.data
    author = form.author.data

    try:
        wsd = WordSourceDocument(db_session, filename, sst_syslog)
        wsd.read_docs_as_html()
        html = wsd.build_html_output_tree()
        if not html:
            form.errors['work_function'] = ['Translation from docx to html failed']
            return False
        content_features = wsd.get_content_features()
        if 'byline' in content_features.keys():
            author = content_features['byline']
        if 'title' in content_features.keys():
            page_title = content_features['title']
        new_page = Page(page_title=page_title, page_name=page_name, page_date=dt.datetime.now(),
                        page_content=html, page_status='publish', page_guid='Needs GUID', page_author=author)
        new_page.add_to_db(db_session, commit=True)
        return True

    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['file process_page_masters - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False



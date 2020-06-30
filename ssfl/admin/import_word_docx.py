import os
from flask import send_file
from utilities.miscellaneous import get_temp_file_name
from config import Config
from db_mgt.page_tables import Page, PageManager
from utilities.miscellaneous import get_temp_file_name
import datetime as dt
from process_word_sources.process_word_source import WordSourceDocument
from ssfl import sst_syslog
import csv
from db_mgt.db_exec import DBExec
from process_word_sources.process_word_source import verify
from werkzeug.utils import secure_filename


def import_docx_and_add_to_db(db_exec: DBExec, form):
    """Import docx file to html and add to database"""
    """
     Route: '/admin/sst_import_page' => import_word_docx
     Template: import_docx.jinja2
     Form: import_docx_form.py
     Processor: import_word_docx.py
    """

    function_to_execute = form.work_function.data
    page_title = 'Default Title'
    page_name = form.page_name.data
    file = form.file_name.data
    overwrite = form.overwrite.data
    wordpress_file = form.wordpress_file.data

    page_mgr = db_exec.create_page_manager()
    try:
        if function_to_execute == 'docx_wp_page':
            build_wp = True
        else:
            build_wp = False
        secure_filename(file.filename)
        file_path = get_temp_file_name('word', 'docx')
        file.save(file_path)
        wsd = WordSourceDocument(db_exec, sst_syslog, build_for_wordpress=build_wp)
        wsd.set_source_path(file_path)
        wsd.read_docs_as_html()
        html = wsd.build_html_output_tree()
        if not html:
            form.errors['file_name'] = ['Translation from docx to html failed']
            return False
        if build_wp:
            path = wordpress_file + '.html'
            temp_fp = get_temp_file_name('html', 'html')
            with open(temp_fp, 'w') as fp:
                fp.write(html)
                fp.close()
                return send_file(temp_fp, mimetype='application/octet', as_attachment=True,
                                 attachment_filename=path)
        else:
            # Each of byline, title, snippet may be null without problems
            byline = wsd.get_content_feature_value('byline', 'byline')
            title = wsd.get_content_feature_value('title', 'title')
            snippet = wsd.get_content_feature_value('snippet', 'snippet')
            verify(html)
            new_page = Page(page_title=title, page_name=page_name, page_date=dt.datetime.now(),
                            page_content=html, page_status='publish', page_guid='Needs GUID', page_author=byline,
                            page_snippet=snippet)
            verify(new_page.page_content)
            page_mgr.add_page_to_database(new_page, overwrite)
            return True

    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['file process_page_masters - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

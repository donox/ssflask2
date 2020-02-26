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


def miscellaneous_functions(db_session, form):
    """Place to build support before rebuilding interface."""
    function_to_execute = form.work_function.data
    page_name = form.page_name.data
    filename = form.filename.data

    try:
        if function_to_execute == 'dpdb':     # 'Delete Page from Database'
            page_query = db_session.query(Page).filter(Page.page_name == page_name)
            ct = page_query.count()
            if ct == -1:
                form.errors['page_name'] = [f'Page {page_name} does not exist']
                return False
            page_query.delete()
            db_session.commit()
            return function_to_execute, True
        elif function_to_execute == 'df':           # Delete File
            # TODO: Broken - must be in directory relative to static
            os.remove(filename)
            return function_to_execute, True
        elif function_to_execute == 'dp':           # Download a csv file of the Page Table
            pm = PageManager(db_session)
            file = get_temp_file_name('csv', 'csv')
            with open(file, 'w') as outfile:
                writer = csv.writer(outfile)
                key_list = ['id', 'page_name', 'page_date', 'page_title', 'page_author', 'page_parent']
                writer.writerow(key_list)
                for vals in pm.generate_page_records(key_list):
                    writer.writerow(vals)
                outfile.close()
            return function_to_execute, file


        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['file process_page_masters - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

import os

from config import Config
from db_mgt.page_tables import Page
from utilities.shell_commands import run_shell_command
from utilities.miscellaneous import get_temp_file_name
import datetime as dt
from process_word_sources.process_word_source import WordSourceDocument
from ssfl import sst_syslog


def translate_docx_and_add_to_db(db_session, form):
    """Convert docx file to html and add to database"""
    function_to_execute = form.work_function.data
    page_title = form.page_title.data
    page_name = form.page_name.data
    filename = os.path.join(Config.USER_PAGE_MASTERS, form.filename.data)
    new_page = form.new_page.data
    author = form.author.data

    try:
        if function_to_execute == 'db':     # 'Add Page to Database'
            page_query = db_session.query(Page).filter(Page.page_name == page_name)
            ct = page_query.count()
            if new_page and ct > 0:
                form.errors['page_name'] = [f'Page {page_name} already exists, but overwrite not permitted.']
                return False
            elif not new_page and ct == 0:
                form.errors['page_name'] = [f'Page {page_name} does not exist, but new page is not indicated.']
                return False

            html_fl = get_temp_file_name('html', 'html')

            # FIX THIS TO REMOVE FILE DIRECTORY HANDLING FROM WSD
            wsd = WordSourceDocument(filename, sst_syslog)
            wsd.read_docs_as_html()
            html = wsd.build_html_output_tree()
            if not html:
                form.errors['work_function'] = ['Translation from docx to html failed']
                return False
            new_page = Page(page_title=page_title, page_name=page_name, page_date=dt.datetime.now(),
                            page_content=html, page_status='publish', page_guid='Needs GUID', )
            new_page.add_to_db(db_session, commit=True)
            return True

        elif function_to_execute == 'dpdb':     # 'Delete Page from Database'
            page_query = db_session.query(Page).filter(Page.page_name == page_name)
            ct = page_query.count()
            if ct == -1:
                form.errors['page_name'] = [f'Page {page_name} does not exist']
                return False
            page_query.delete()
            db_session.commit()
            return True
        elif function_to_execute == 'df':           # 'Delete File from Page Masters'
            os.remove(filename)
            return True
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['file process_page_masters - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

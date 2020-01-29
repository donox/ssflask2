import os

from config import Config
from db_mgt.page_tables import Page
from utilities.shell_commands import run_shell_command
from utilities.miscellaneous import get_temp_file_name
import datetime as dt


def translate_docx_and_add_to_db(db_session, form):
    """Convert docx file to html and add to database"""
    function_to_execute = form.work_function.data
    page_title = form.page_title.data
    page_name = form.page_name.data
    filename = os.path.join(Config.USER_PAGE_MASTERS, form.filename.data) + '.docx'
    new_page = form.new_page.data
    author = form.author.data

    try:
        if function_to_execute == 'up':
            page_query = db_session.query(Page).filter(Page.page_name == page_name)
            ct = page_query.count()
            if new_page and ct > 0:
                form.errors['Page Exists'] = ['Page already exists, but overwrite not permitted.']
                return False
            elif not new_page and ct == 0:
                form.errors['Page Does Not Exist'] = ['Page does not exist, but new page is not indicated.']
                return False

            html_fl = get_temp_file_name('html', 'html')
            cmd_run_mammoth = f'mammoth {filename}  {html_fl}'
            res = run_shell_command(cmd_run_mammoth)
            if not res:
                form.errors['Translate Fail'] = ['Translation from docx to html failed']
                return False
            with open(html_fl, 'r') as fl:
                html = fl.readlines()
                new_page = Page(page_title=page_title, page_name=page_name, page_date=dt.datetime.now(),
                                page_content=html, page_status='publish', page_guid='Needs GUID', )
                new_page.add_to_db(db_session, commit=True)
                return True
            form.errors['Add to DB Fail'] = ['Did not succeed']
            return False
        elif function_to_execute == 'dpdb':
            page_query = db_session.query(Page).filter(Page.page_name == page_name)
            ct = page_query.count()
            if ct == -1:
                form.errors['Page Exists'] = ['Page does not exist']
                return False
            page_query.delete()
            db_session.commit()
            return True
        elif function_to_execute == 'df':
            os.remove(filename)
            return True
        else:
            form.errors['Not Implemented'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = ['Exception occurred processing page']
        return False

from db_mgt.page_tables import Page
from utilities.sst_exceptions import DataEditingSystemError
from wtforms import ValidationError


def edit_database_file(session, form):
    """Edit file that is stored in database."""
    page_id = form.page_id.data
    direct = form.directory.data
    file = form.file_name.data

    try:
        if page_id:
            page = session.query(Page).filter(Page.id == page_id).first()
        else:
            page_name = form.page_name.data.lower()
            page = session.query(Page).filter(Page.page_name == page_name).first()
            if page is None:
                form.errors['Page Not Found'] = ['There was no page with that name.']
                return False
        if page.page_content != '' and page.page_content is not None:
            with open(direct + '/' + file, 'w') as fl:
                fl.write(page.page_content)
                fl.close()
                return True
        else:
            form.errors['Page Empty'] = ['Database page had no content']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = ['Exception occurred processing page']
        return False


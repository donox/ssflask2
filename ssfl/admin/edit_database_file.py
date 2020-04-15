from flask import send_file
from werkzeug.utils import secure_filename

from utilities.miscellaneous import get_temp_file_name
from utilities.sst_exceptions import log_sst_error


def edit_database_file(db_exec, form):
    """Edit file that is stored in database.

        This applies to the case where there is both a database entry and valid filename."""
    """
     Route: '/admin/edit' => edit_database_file
     Template: edit.jinja2
     Form: edit_db_content_form.py
     Processor: edit_database_file.py
    """
    page_id = form.page_id.data
    page_name = form.page_name.data
    download_file_name = form.file_name.data
    upload_file = form.upload_file
    direction = form.direction.data

    submit = form.submit.data

    page_mgr = db_exec.create_page_manager()

    try:
        page = page_mgr.fetch_page(page_id, page_name)
        if not page.id:
            form.errors['Page Not Found'] = ['There was no page with that name/id.']
            return False
        if direction:
            if page.page_content != '' and page.page_content is not None:
                file_path = get_temp_file_name('page_edit', 'html')
                with open(file_path, 'w') as fl:
                    fl.write(page.page_content)
                    fl.close()
                return send_file(file_path, mimetype='application/octet', as_attachment=True,
                                 attachment_filename=download_file_name)
            else:
                form.errors['Page Empty'] = ['Database page had no content']
                return False
        else:
            file = form.upload_file.data
            secure_filename(file.filename)
            file_path = get_temp_file_name('page_edit', 'html')
            file.save(file_path)
            with open(file_path, 'r') as fl:
                page.page_content = fl.read()
                page_mgr.add_page_to_database(page, True)  # 2nd arg indicates overwrite existing page
                return True
    except Exception as e:
        log_sst_error(e, 'Unexpected Error in edit_database_file')
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = ['Exception occurred processing page']
        return False

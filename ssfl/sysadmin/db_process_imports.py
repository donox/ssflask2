import os
from config import Config

from db_mgt.page_tables import Page, PageManager
from utilities.miscellaneous import get_temp_file_name
import csv
from .db_import_pages import ImportPageData
from .db_import_photos import ImportPhotoData
from .db_import_users import ImportUserData
from ssfl.sysadmin.manage_photo_files import ManagePhotoFiles
from flask import render_template


def db_process_imports(db_exec, form):
    """Functions to import data from wp db to flask db."""
    """
     Route: '/admin/sst_import_database' => db_import_pages
     Template: import_database_functions.jinja2
     Form: import_database_functions_form.py
     Processor: db_import_pages.py
    """
    function = form.work_function.data
    page_name = form.page_name.data
    filename = form.filename.data
    local_gallery = form.local_gallery_folder.data

    try:
        page_mgr = db_exec.create_page_manager()
        if function == 'import_pages':
            page_importer = ImportPageData(db_exec, form)
            page_importer.import_useable_pages_from_wp_database()
            return True
        elif function == 'import_photos':
            mgr = ImportPhotoData(db_exec, form)
            mgr.import_all_galleries()
            mgr.import_all_photos()
            return True
        elif function == 'load_photo_files':
            mgr = ManagePhotoFiles()
            mgr.update_photo_files_from_backup(local_gallery, Config.USER_DIRECTORY_IMAGES)
            return True

        elif function == 'import_users':
            mgr = ImportUserData(db_exec, form)
            mgr.import_users()
            return True
        else:
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['file process_page_masters - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

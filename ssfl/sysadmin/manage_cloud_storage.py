import os
from db_mgt.db_exec import DBExec
from utilities.manage_google_drive import ManageGoogleDrive
import csv
from lxml import etree, html
import lxml
from flask import send_file, render_template


def manage_cloud_storage(db_exec: DBExec, form):
    """Manage interaction with Google Drive."""
    """
     Route: '/admin/cloud' => manage_cloud_storage
     Template: cloud.jinja2
     Form: manage_cloud_storage_form.py
     Processor: manage_cloud_storage.py
    """
    function_to_execute = form.work_function.data
    directory_path = form.directory_path.data
    save_directory = form.save_directory.data
    filename = form.filename.data
    db_only = form.db_only.data
    install_backup = form.install_backup.data

    result_template = 'sysadmin/list_directory.jinja2'

    try:
        drive_mgr = ManageGoogleDrive()
        if function_to_execute == 'cl_ls':  # 'List Drive Directory'
            res = drive_mgr.list_directory(directory_path)
            res = res.decode("utf-8")
            res = res.split('\n')
            split_res = []
            for path in res:
                split_res.append(path.strip().split(' ', 1))

            context = {'function': function_to_execute,
                       'directory': directory_path,
                       'fields': ['Size', 'Directory Path'],
                       'values': split_res}
            result = render_template(result_template, **context)
            return result

        elif function_to_execute == 'cl_df':  # Download specific file
            res = drive_mgr.download_file(directory_path, filename, save_directory)
            return res

        elif function_to_execute == 'cl_bk':  # Process Backup
            res = drive_mgr.download_file(directory_path, filename, save_directory)
            return res

        elif function_to_execute == 'cl_mr':  # Process Backup
            res = drive_mgr.identify_most_recent_backup_files()
            context = {'function': function_to_execute,
                       'directory': 'UpdraftPlus',
                       'fields': ['Size', 'Directory Path'],
                       'values': res}
            result = render_template(result_template, **context)
            return result

        elif function_to_execute == 'cl_db':  # Download Backup
            res = drive_mgr.download_backup(save_directory, db_only=db_only, install_backup=install_backup)
            return res

        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['miscellaneous_functions - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

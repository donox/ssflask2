import os
from db_mgt.db_exec import DBExec
import os

from flask import send_file, render_template

from config import Config
from stat import *  # ST_SIZE, ....
from werkzeug.utils import secure_filename

result_template = 'sysadmin/display_files.jinja2'
report_fields = ['view', 'delete', 'file_name', 'size', 'created', 'modified']
file_directory_paths = {'downloads': Config.USER_DIRECTORY_BASE + 'downloads/',
                        'gen_pages': Config.USER_DIRECTORY_BASE + 'gen_pages/',
                        'plots': Config.USER_DIRECTORY_BASE + 'plots/',
                        'definition_files': Config.USER_DIRECTORY_BASE + 'definition_files/',
                        'uploads': Config.USER_DIRECTORY_BASE + 'uploads/',
                        'photo_uploads': Config.USER_DIRECTORY_BASE + 'photo_uploads/'}
# ('downloads', 'downloads'),
#                               ('gen_pages', 'gen_pages'),
#                               ('plots', 'plots'),
#                               ('definition_files', 'definition_files'),
#                               ('uploads', 'uploads'),
#                               ('photo_uploads', 'photo_uploads')

def manage_files_commands(db_exec: DBExec, form):
    """Functions that support the commands in the prototype form."""
    """
     Route: '/sysadmin/manage_users' => manage_users
     Template: manage_users.jinja2
     Display: display_users.jinja2
     Form: manage_users_form.py
     Processor: manage_users.py
    """
    function_to_execute = form.work_function.data
    file_directory = form.file_directory.data
    upload_file = form.upload_file.data
    file_to_load = form.file_name.data
    try:
        if function_to_execute == 'mf_disp':  # 'Display and/or Delete Files'
            direct = Config.USER_DIRECTORY_BASE + file_directory + '/'
            list_dir = os.listdir(direct)
            files = [x for x in list_dir if os.path.isfile(''.join([direct, x]))]
            context = {'function': function_to_execute,
                       'file_list': {},
                       'directory': file_directory}
            report_list = []
            for file in files:
                file_path = direct + file
                file_stats = os.stat(file_path)
                field_values = {'directory': file_directory}
                del_button = dict()
                del_button['action'] = '/admin/delete_file'
                del_button['function'] = 'Delete'
                del_button['method'] = 'POST'
                del_button['directory'] = direct
                del_button['filename'] = file
                view_button = dict()
                view_button['action'] = f''
                view_button['show_file'] = file
                view_button['function'] = 'View'
                view_button['method'] = 'GET'
                view_button['action'] = f'/sys_download_file'
                view_button['directory'] = direct
                view_button['filename'] = file
                field_values['view_button'] = view_button
                field_values['del_button'] = del_button
                field_values['file_name'] = file
                field_values['size'] = file_stats[ST_SIZE]
                field_values['created'] = file_stats[ST_CTIME]
                field_values['modified'] = file_stats[ST_MTIME]
                report_list.append(field_values)
                context = dict()
                context['function'] = 'mf_disp'
                context['fields'] = report_fields
                context['values'] = report_list
            context['reports'] = report_list
            result = render_template(result_template, **context)
            return result
        elif function_to_execute == 'mf_upld':
            secure_filename(upload_file.filename)
            file_path = file_directory_paths[file_directory] + file_to_load
            upload_file.save(file_path)
            return True
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        form.errors['work_function'] = ['manage groups - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

import os
from db_mgt.db_exec import DBExec
import os
import sys
from db_mgt.user_models import UserManager, User, Role, UserRoles
from utilities.miscellaneous import get_temp_file_name, extract_fields_to_dict
from flask import send_file, render_template
from utilities.sst_exceptions import SsTSystemError
from datetime import datetime as dt
from flask_user.password_manager import PasswordManager
from email_validator import validate_email, EmailNotValidError
from flask import current_app as app
from config import Config
from stat import *  # ST_SIZE, ....

result_template = 'sysadmin/display_files.jinja2'
report_fields = ['view', 'delete', 'file_name', 'size', 'created', 'modified']

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
    try:
        user_mgr = db_exec.create_user_manager()
        if function_to_execute == 'mf_disp':  # 'Set User Roles'
            direct = Config.USER_DIRECTORY_BASE + file_directory + '/'
            list_dir = os.listdir(direct)
            files = [x for x in list_dir if os.path.isfile(''.join([direct, x]))]
            context = {'function': function_to_execute,
                       'file_list': {}}
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
        # elif function_to_execute == 'usr_add':
        #     try:
        #         do_stuff()
        #         return True           #if success
        # elif function_to_execute == 'usr_del':
        #     user_id = user_mgr.get_user_id_from_name(user_name)
        #     if not user_id:
        #         form.errors['No Such User'] = [f'User: {user_name} not found.']
        #         return False
        #     user_mgr.delete_user_by_id(user_id)
        #     return True
        # elif function_to_execute == 'usr_mod':
        #     user_id = user_mgr.get_user_id_from_name(user_name)
        #     if not user_id:
        #         form.errors['No Such User'] = [f'User: {user_name} not found.']
        #         return False
        #     user = user_mgr.get_user_by_id(user_id)
        #     if user_email:
        #         try:
        #             valid = validate_email(user_email)
        #             user.email = valid.email
        #         except EmailNotValidError as e:
        #             form.errors['Invalid Email'] = [f'Invalid email.  Validation returned {e.args}']
        #             return False
        #     user_name_parts = user_name.split()
        #     user.last_name = user_name_parts[-1]
        #     user.first_name = ' '.join(user_name_parts[0:-1])
        #     if user_password:
        #         pm = PasswordManager(app)
        #         user.password = pm.hash_password(user_password)
        #     user_mgr.update_user(user)
        #     return True

        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        form.errors['work_function'] = ['manage groups - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

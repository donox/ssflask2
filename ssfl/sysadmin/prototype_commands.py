import os
from db_mgt.db_exec import DBExec
from db_mgt.user_models import UserManager, User, Role, UserRoles
from utilities.miscellaneous import get_temp_file_name, extract_fields_to_dict
from flask import send_file, render_template
from utilities.sst_exceptions import SsTSystemError
from datetime import datetime as dt
from flask_user.password_manager import PasswordManager
from email_validator import validate_email, EmailNotValidError
from flask import current_app as app
import requests
from twill.commands import *
from twill import browser



def prototype_commands(db_exec: DBExec, form):
    """Functions that support the commands in the prototype form."""
    """
     Route: '/sysadmin/manage_users' => manage_users
     Template: manage_users.jinja2
     Display: display_users.jinja2
     Form: manage_users_form.py
     Processor: manage_users.py
    """
    function_to_execute = form.work_function.data
    user_name = form.user_name.data
    try:
        user_mgr = db_exec.create_user_manager()
        user_id = user_mgr.get_user_id_from_name(user_name)
        if not user_id and function_to_execute != 'usr_add':
            form.errors['user_name'] = [f'User name {user_name} was not recognized.']
            return False
        if function_to_execute == 'log_usr':  # 'Set User Roles'
            user = user_mgr.get_user_by_id(user_id)
            roles = user_mgr.get_user_roles(user_id)
            url = 'https://www.sunnyside-times.com'
            values = {'username': 'Kate Seaton',
                      'password': 'Sunny'}
            browser.go(url)
            formvalue(2, 1, values['username'])
            formvalue(2, 2, values['password'])
            submit()
            browser.go(url)
            foo = 3
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

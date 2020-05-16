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



def manage_users_functions(db_exec: DBExec, form):
    """Functions to manage groups."""
    """
     Route: '/sysadmin/manage_users' => manage_users
     Template: manage_users.jinja2
     Display: display_users.jinja2
     Form: manage_users_form.py
     Processor: manage_users.py
    """
    function_to_execute = form.work_function.data
    user_name = form.user_name.data
    user_password = form.user_password.data
    user_email = form.user_email.data
    user_roles = form.user_roles.data
    result_template = 'sysadmin/display_users.jinja2'
    #   usr_sr usr_del usr_add usr_mod
    try:
        user_mgr = db_exec.create_user_manager()
        user_id = user_mgr.get_user_id_from_name(user_name)
        if not user_id and function_to_execute != 'usr_add':
            form.errors['user_name'] = [f'User name {user_name} was not recognized.']
            return False
        if function_to_execute == 'usr_sr':  # 'Set User Roles'
            user = user_mgr.get_user_by_id(user_id)
            roles = user_mgr.get_user_roles(user_id)
            for role in roles:
                if role not in user_roles:
                    user_mgr.remove_role_from_user(role, user_id)
            for role in user_roles:
                if role not in roles:
                    user_mgr.add_role_to_user(role, user_id)
            return True
        elif function_to_execute == 'usr_add':
            try:
                valid = validate_email(user_email)
                email = valid.email
            except EmailNotValidError as e:
                form.errors['Invalid Email'] = [f'Invalid email.  Validation returned {e.args}']
                return False
            user_name_parts = user_name.split()
            last_name = user_name_parts[-1]
            first_name = ' '.join(user_name_parts[0:-1])
            pm = PasswordManager(app)
            hashed_password = pm.hash_password(user_password)
            user = User(first_name=first_name, last_name=last_name, email=email, password=hashed_password,
                        username=user_name)
            user.add_to_db(db_exec.db_session, commit=True)    # No need to commit - will happen after other entries.
            user_id = user.id
            user_mgr.add_role_to_user('User', user_id)   # This does a commit as a side-effect
            return True
        elif function_to_execute == 'usr_del':
            user_id = user_mgr.get_user_id_from_name(user_name)
            if not user_id:
                form.errors['No Such User'] = [f'User: {user_name} not found.']
                return False
            user_mgr.delete_user_by_id(user_id)
            return True
        elif function_to_execute == 'usr_mod':
            user_id = user_mgr.get_user_id_from_name(user_name)
            if not user_id:
                form.errors['No Such User'] = [f'User: {user_name} not found.']
                return False
            user = user_mgr.get_user_by_id(user_id)
            if user_email:
                try:
                    valid = validate_email(user_email)
                    user.email = valid.email
                except EmailNotValidError as e:
                    form.errors['Invalid Email'] = [f'Invalid email.  Validation returned {e.args}']
                    return False
            user_name_parts = user_name.split()
            user.last_name = user_name_parts[-1]
            user.first_name = ' '.join(user_name_parts[0:-1])
            if user_password:
                pm = PasswordManager(app)
                user.password = pm.hash_password(user_password)
            user_mgr.update_user(user)
            return True

        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['manage groups - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

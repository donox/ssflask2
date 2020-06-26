import os
from db_mgt.db_exec import DBExec
from linkages.graph import Graph, Edge, Node
from linkages.keywords import KeywordEdge, KeywordNode
import json


def manage_system_config_commands(db_exec: DBExec, form):
    """Functions that support the commands to modify selected JSON values."""
    """
     Route: '/sysadmin/manage_system_configuration' => manage_system_config_commands
     Template: manage_system_configuration.jinja2
     Form: manage_system_configuration_form.py
     Processor: manage_system_config_commands.py
    """
    function_to_execute = form.work_function.data
    template_name = form.template_name.data
    new_main_page = form.new_main_page.data
    try:
        if function_to_execute == 'sys_main':  # 'Load new graph'
            json_mgr = db_exec.create_json_manager()
            main_config = json_mgr.get_json_from_name(template_name)
            if not main_config:
                form.errors['template_name'] = [f'Template named {template_name} was not recognized.']
                return False
            main_config['main'] = new_main_page
            json_mgr.add_json(template_name, main_config)
            return True


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

import os
import sys

import dateutil.parser
from flask import Blueprint, render_template, url_for, request, send_file, \
    abort, jsonify, flash, Response
from flask import current_app as app
from flask_user import login_required, roles_required

from config import Config
from db_mgt.db_exec import DBExec
from ssfl.admin.routes import build_route, flash_errors
from db_mgt.setup import get_engine, create_session, close_session
from ssfl import sst_admin_access_log
from ssfl.sysadmin.manage_groups import manage_group_functions
from ssfl.sysadmin.manage_users import manage_users_functions
from ssfl.sysadmin.sst_login_commands import sst_login_commands
from ssfl.sysadmin.manage_files_commands import manage_files_commands
from utilities.sst_exceptions import RequestInvalidMethodError
from utilities.sst_exceptions import log_sst_error
from .forms.manage_groups_form import ManageGroupsForm
from .forms.manage_users_form import ManageUsersForm
from .forms.sst_login_form import SSTLoginForm
from .forms.manage_files_form import ManageFilesForm
from import_data.db_process_imports import db_process_imports

# Set up a Blueprint
sysadmin_bp = Blueprint('sysadmin_bp', __name__,
                        template_folder='templates',
                        static_folder='static')


# To add a new route, copy a route below that uses build_route (if appropriate) and fill in names of
# templates and functions.


@sysadmin_bp.route('/test', methods=['GET'])
@roles_required('SysAdmin')
def test():
    sst_admin_access_log.make_info_entry(f"Route: /admin/run_ace")

    return app.send_static_file('dist/index.html')


@sysadmin_bp.route('/sysadmin/manage_groups', methods=['GET', 'POST'])
@roles_required('SysAdmin')
def manage_groups():
    """Functions to create/delete and manager custom groups"""
    """
     Route: '/sysadmin/manage_groups' => manage_groups
     Template: manage_groups.jinja2
     Form: manage_groups_form.py
     Processor: manage_groups.py
    """
    return build_route('sysadmin/manage_groups.jinja2', ManageGroupsForm(), manage_group_functions,
                       '/sysadmin/manage_groups')()


@sysadmin_bp.route('/sysadmin/manage_users', methods=['GET', 'POST'])
@roles_required('SysAdmin')
def manage_users():
    """Functions to manage users."""
    """
     Route: '/sysadmin/manage_users' => manage_users
     Template: manage_users.jinja2
     Display: display_users.jinja2
     Form: manage_users_form.py
     Processor: manage_users.py
    """
    return build_route('sysadmin/manage_users.jinja2', ManageUsersForm(), manage_users_functions,
                       '/sysadmin/manage_users')()

@sysadmin_bp.route('/sysadmin/manage_files', methods=['GET', 'POST'])
@roles_required('SysAdmin')
def manage_files():
    """Functions to manage files."""
    """
     Route: '/sysadmin/manage_files' => manage_files_commands
     Template: manage_files.jinja2
     Display: display_manage_files.jinja2
     Form: manage_files_form.py
     Processor: manage_files_commands.py
    """
    return build_route('sysadmin/manage_files.jinja2', ManageFilesForm(), manage_files_commands,
                       '/sysadmin/manage_files')()


@sysadmin_bp.route('/sysadmin/sst_login', methods=['GET', 'POST'])
@roles_required('SysAdmin')
def sst_login():
    """Transfer content to-from DB for local editing."""
    """
     Route: '/admin/edit' => edit_database_file
     Template: edit.jinja2
     Form: edit_db_content_form.py
     Processor: edit_database_file.py
    """
    return build_route('sysadmin/sst_login.jinja2', SSTLoginForm(), sst_login_commands, '/sysadmin/sst_login')()

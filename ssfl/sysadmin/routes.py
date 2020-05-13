import os
import sys

import dateutil.parser
from flask import Blueprint, render_template, url_for, request, send_file, \
    abort, jsonify, flash, Response
from flask import current_app as app
from flask_login import login_required

from config import Config
from db_mgt.db_exec import DBExec
from ssfl.admin.routes import build_route, flash_errors
from db_mgt.setup import get_engine, create_session, close_session
from ssfl import sst_admin_access_log
from ssfl.sysadmin.manage_groups import manage_group_functions
from utilities.sst_exceptions import RequestInvalidMethodError
from utilities.sst_exceptions import log_sst_error
from .forms.manage_groups_form import ManageGroupsForm
from import_data.db_process_imports import db_process_imports

# Set up a Blueprint
sysadmin_bp = Blueprint('sysadmin_bp', __name__,
                        template_folder='templates',
                        static_folder='static')


@sysadmin_bp.route('/test', methods=['GET'])
@login_required
def test():
    sst_admin_access_log.make_info_entry(f"Route: /admin/run_ace")

    return app.send_static_file('dist/index.html')


@sysadmin_bp.route('/run_ace', methods=['GET'])
@login_required
def run_ace():
    sst_admin_access_log.make_info_entry(f"Route: /admin/run_ace")
    context = dict()
    return render_template('/admin/run_ace.jinja2', **context)


@sysadmin_bp.route('/sysadmin/manage_groups', methods=['GET', 'POST'])
@login_required
def manage_groups():
    return build_route('sysadmin/manage_groups.jinja2', ManageGroupsForm(), manage_group_functions, '/sysadmin/manage_groups')()



@sysadmin_bp.route('/admin/edit', methods=['GET', 'POST'])
@login_required
def sst_admin_edit():
    """Transfer content to-from DB for local editing."""
    """
     Route: '/admin/edit' => edit_database_file
     Template: edit.jinja2
     Form: edit_db_content_form.py
     Processor: edit_database_file.py
    """
    # return build_route('admin/edit.jinja2', DBContentEditForm(), edit_database_file, '/admin/edit')()



def xbuild_route(template, processing_form, processing_function, route_name):
    def route():
        db_exec = DBExec()
        db_exec.set_current_form(processing_form)
        context = dict()
        context['form'] = processing_form
        sst_admin_access_log.make_info_entry(f"Route: {route_name}")


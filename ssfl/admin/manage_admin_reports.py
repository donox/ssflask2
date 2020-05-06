import os
from db_mgt.db_exec import DBExec
from db_mgt.admin_report_table_manager import AdminReport, AdminReportManager
import datetime as dt
from flask_login import current_user
from utilities.miscellaneous import get_temp_file_name
import csv
from lxml import etree, html
import lxml
from flask import send_file


def manage_admin_reports(db_exec: DBExec, form):
    """Create and manage reports for tracking bugs, suggestions, or other admin data."""
    """
    Route: '/admin/make_report' => manage_admin_reports
    Template: make_report.jinja2
    Form: manage_admin_reports_form.py
    Processor: manage_admin_reports.py
    """
    function_to_execute = form.work_function.data
    entry_type = form.entry_type.data
    content = form.content.data

    try:
        report_mgr = db_exec.create_report_manager()
        if function_to_execute == 'ar_report':  # 'Make a new Report'
            user = current_user.id
            new_report = AdminReport(creator=user, entry_type=entry_type, content=content, status='active',
                                     created=dt.datetime.now())
            report_mgr.add_report_to_database(new_report, commit=True)
            return True
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False


    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['miscellaneous_functions - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

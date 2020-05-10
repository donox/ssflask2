import os
from db_mgt.db_exec import DBExec
from db_mgt.admin_report_table_manager import AdminReport, AdminReportManager
import datetime as dt
from flask_login import current_user
from flask import render_template
from utilities.miscellaneous import extract_fields_to_dict


def manage_admin_reports(db_exec: DBExec, form):
    """Create and manage reports for tracking bugs, suggestions, or other admin data."""
    """
    Route: '/admin/make_report' => manage_admin_reports
    Template: make_report.jinja2
    Display:  display_admin_report.jinja2
    Form: manage_admin_reports_form.py
    Processor: manage_admin_reports.py
    """
    function_to_execute = form.work_function.data
    entry_type = form.entry_type.data
    content = form.content.data
    result_template = 'admin/display_admin_report.jinja2'
    report_fields = ['view', 'delete', 'id', 'entry_type', 'creator', 'created', 'status', 'content']

    try:
        report_mgr = db_exec.create_report_manager()
        user_mgr = db_exec.create_user_manager()
        if function_to_execute == 'ar_report':  # 'Make a new Report'
            user = current_user.id
            new_report = AdminReport(creator=user, entry_type=entry_type, content=content, status='active',
                                     created=dt.datetime.now())
            report_mgr.add_report_to_database(new_report, commit=True)
            return True
        if function_to_execute == 'ar_display':
            nbr_reports = 10
            reports = report_mgr.get_reports(nbr_reports)
            context = dict()
            context['function'] = function_to_execute
            report_list = []
            for report in reports:
                field_values = extract_fields_to_dict(report, report_fields)
                field_values['creator'] = user_mgr.get_user_name_from_id(field_values['creator'])
                del_button = dict()
                del_button['action'] = '/admin/delete_row'
                del_button['table'] = 'admin-reports'
                del_button['row_id'] = report.id
                del_button['function'] = 'Delete'
                del_button['method'] = 'POST'
                field_values['del_button'] = del_button
                view_button = dict()
                view_button['action'] = f'/main/page/{report.id}'
                view_button['table'] = 'admin-reports'
                view_button['row_id'] = report.id
                view_button['function'] = 'View'
                view_button['method'] = 'GET'
                field_values['view_button'] = view_button
                report_list.append(field_values)
                context = dict()
                context['function'] = 'ar_display'
                context['fields'] = report_fields
                context['values'] = report_list
            context['reports'] = report_list
            result = render_template(result_template, **context)
            return result

        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False


    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['miscellaneous_functions - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

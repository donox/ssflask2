import os
import sys

import dateutil.parser
from flask import Blueprint, render_template, url_for, request, send_file, \
    abort, jsonify, redirect, flash, Response
from flask import current_app as app
from flask_login import login_required

from config import Config
from db_mgt.db_exec import DBExec
from db_mgt.setup import get_engine, create_session, close_session
from import_data.db_import_pages import ImportPageData
from import_data.db_import_photos import ImportPhotoData
from ssfl import sst_admin_access_log
from ssfl.admin.manage_events.import_word_docx import import_docx_and_add_to_db
from utilities.sst_exceptions import RequestInvalidMethodError
from utilities.sst_exceptions import log_sst_error
from .edit_database_file import edit_database_file
from .edit_json_file import edit_json_file
from .forms.db_json_manage_templates_form import DBJSONManageTemplatesForm
from .forms.edit_db_content_form import DBContentEditForm
from .forms.edit_db_json_content_form import DBJSONEditForm
from.forms.manage_page_data_form import DBManagePages
from .forms.import_database_functions_form import ImportDatabaseFunctionsForm
from .forms.import_word_doc_form import ImportMSWordDocForm
from .forms.manage_calendar_form import ManageCalendarForm
from .forms.manage_index_pages_form import ManageIndexPagesForm
from .forms.manage_photo_functions_form import DBPhotoManageForm
from .forms.miscellaneous_functions_form import MiscellaneousFunctionsForm
from .manage_events.event_retrieval_support import SelectedEvents
from .get_database_data import db_manage_pages
from .manage_events.manage_calendar import manage_calendar
from .manage_index_pages import DBManageIndexPages
from .manage_json_templates import manage_json_templates
from .manage_photo_functions import manage_photo_functions
from .miscellaneous_functions import miscellaneous_functions


# Set up a Blueprint
admin_bp = Blueprint('admin_bp', __name__,
                     template_folder='templates',
                     static_folder='static')


def flash_errors(form):
    """Flashes form errors"""
    for field, errors in form.errors.items():
        for error in errors:
            if hasattr(form, field):
                flash(u"routes - Error in the %s field - %s" % (getattr(form, field).label.text, error), 'error')
            else:
                flash(u"%s error: %s" % (field, error), 'error')


@admin_bp.route('/run_ace', methods=['GET'])
@login_required
def run_ace():
    sst_admin_access_log.make_info_entry(f"Route: /admin/run_ace")
    context = dict()
    return render_template('/admin/run_ace.jinja2', **context)


@admin_bp.route('/run_js_test', methods=['GET'])
@login_required
def run_js_test():
    sst_admin_access_log.make_info_entry(f"Route: /admin/run_js_test")
    context = dict()
    return render_template('/admin/run_js_test.jinja2', **context)


# These functions are not directly called by the user but support calls from the client
# that were initiated from another route.
@admin_bp.route('/downloads/<string:file_path>', methods=['GET'])
@login_required
def get_downloadXX(file_path):
    sst_admin_access_log.make_info_entry(f"Route: /admin/get_download/{file_path}")
    path = Config.USER_DIRECTORY_BASE + file_path
    if os.path.exists(path):
        with open(path, 'r') as fl:
            return send_file(fl, mimetype='application/octet')
    else:
        abort(404)


@admin_bp.route('/admin/events', methods=['GET'])
@login_required
def get_events():
    """Retrieve events to support FullCalendar

    Returns:  JSON list of events

    """
    sst_admin_access_log.make_info_entry(f"Route: /admin/get_events")
    db_exec = DBExec()
    try:
        args = request.args
        start = dateutil.parser.isoparse(args['start'])
        end = dateutil.parser.isoparse(args['end'])
        audiences = [args['audience']]
        categories = [args['category']]
        event_class = SelectedEvents(db_exec, start, end, audiences, categories)
        events = event_class.get_events_as_dict()
        return jsonify(events)
    except Exception as e:  # Occurs normally if there are no events to show
        return jsonify({})
    finally:
        db_exec.terminate()


@admin_bp.route('/getimage/<path:image_path>', methods=['GET'])
def get_image(image_path):
    # sst_admin_access_log.make_info_entry(f"Route: /admin/get_image/{image_path}")
    db_exec = DBExec()
    try:
        path = Config.USER_DIRECTORY_IMAGES + image_path
        if os.path.exists(path):
            return Response(open(path, 'rb'), direct_passthrough=True)
        else:
            return abort(404, f'File: {image_path} does not exist.')

    finally:
        db_exec.terminate()


def _has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)


@admin_bp.route('/site-map')
def site_map():
    sst_admin_access_log.make_info_entry(f"Route: /admin/site-map")
    links = []
    for rule in app.url_map.iter_rules():
        # Filter out rules we can't navigate to in a browser
        # and rules that require parameters
        if "GET" in rule.methods and _has_no_empty_params(rule):
            url = url_for(rule.endpoint, **(rule.defaults or {}))
            links.append((url, rule.endpoint, rule.methods, rule.arguments))
    for x in links:
        print(x)
    foo = 3  # TODO: render links in template


@admin_bp.route('/admin/edit', methods=['GET', 'POST'])
@login_required
def sst_admin_edit():
    """Transfer content to-from DB for local editing."""
    """
     Route: '/admin/edit' => edit_database_file
     Template: edit.jinja2
     Form: edit_db_content_form.py
     Processor: edit_database_file.py
    """
    return build_route('admin/edit.jinja2', DBContentEditForm(), edit_database_file, '/admin/edit')()


@admin_bp.route('/admin/calendar', methods=['GET', 'POST'])
@login_required
def sst_admin_calendar():
    """Transfer content to-from DB for local editing."""
    """
     Route: '/admin/calendar' => manage_calendar
     Template: calendar.jinja2
     Form: manage_calendar_form.py
     Processor: manage_calendar.py
    """
    return build_route('admin/calendar.jinja2', ManageCalendarForm(), manage_calendar, '/admin/calendar')()


@admin_bp.route('/admin/calendarX', methods=['GET', 'POST'])
@login_required
def sst_admin_calendarX():
    """Transfer content to-from DB for local editing."""
    """
     Route: '/admin/calendar' => manage_calendar
     Template: calendar.jinja2
     Form: manage_calendar_form.py
     Processor: manage_calendar.py
    """
    sst_admin_access_log.make_info_entry(f"Route: /admin/sst_admin_calendar")
    if request.method == 'GET':
        context = dict()
        context['form'] = ManageCalendarForm()
        return render_template('admin/calendar.jinja2', **context)
    elif request.method == 'POST':
        form = ManageCalendarForm()
        context = dict()
        context['form'] = form
        if form.validate_on_submit():
            db_session = create_session(get_engine())
            res = manage_calendar(db_session, form)
            close_session(db_session)
            if type(res) != bool:
                return res
            if res:
                return render_template('admin/calendar.jinja2', **context)  # redirect to success url
        return render_template('admin/calendar.jinja2', **context)
    else:
        raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))


ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'csv', 'toml'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@admin_bp.route('/admin/sst_miscellaneous', methods=['GET', 'POST'])
@login_required
def sst_miscellaneous():
    """Translate file to HTML and store in database."""
    """
     Route: '/admin/sst_miscellaneous' => miscellaneous_functions
     Template: miscellaneous_functions.jinja2
     Form: manage_photos_form.py
     Processor: miscellaneous_functions.py
    """
    sst_admin_access_log.make_info_entry(f"Route: /admin/translate_to_html")
    db_exec = DBExec()
    try:
        if request.method == 'GET':
            context = dict()
            context['form'] = MiscellaneousFunctionsForm()
            return render_template('admin/miscellaneous_functions.jinja2', **context)
        elif request.method == 'POST':
            form = MiscellaneousFunctionsForm()
            context = dict()
            context['form'] = form
            if form.validate_on_submit():
                func, res = miscellaneous_functions(db_exec, form)
                if func in ['dpdb', 'df'] and res:
                    flash('You were successful', 'success')
                    return render_template('admin/miscellaneous_functions.jinja2', **context)  # redirect to success url
                else:
                    return send_file(res, mimetype="text/csv", as_attachment=True)
            flash_errors(form)
            return render_template('admin/miscellaneous_functions.jinja2', **context)
        else:
            raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))
    finally:
        db_exec.terminate()


@admin_bp.route('/admin/manage_index_page', methods=['GET', 'POST'])
@login_required
def manage_index_page():
    """Manage Index Page CRUD and Index Items CRUD."""
    """
     Route: '/admin/manage_index_page' => manage_index_pages
     Template: manage_index_pages.jinja2
     Form: manage_index_pages_form.py
     Processor: manage_index_pages.py
    """
    # TODO: template javascript not handling show/hide properly.
    sst_admin_access_log.make_info_entry(f"Route: /admin/manage_index_page")
    if request.method == 'GET':
        context = dict()
        context['form'] = ManageIndexPagesForm()
        return render_template('admin/manage_index_page.jinja2', **context)
    elif request.method == 'POST':
        form = ManageIndexPagesForm()
        context = dict()
        context['form'] = form
        if form.validate_on_submit():
            try:
                db_session = create_session(get_engine())
                mip = DBManageIndexPages()
                res = mip.process_form(db_session, form)
                close_session(db_session)
                if res:
                    return render_template('admin/manage_index_page.jinja2', **context)  # redirect to success url
                else:
                    return render_template('admin/manage_index_page.jinja2', **context)  # redirect to failure url
            except Exception as e:
                db_session.rollback()
                close_session(db_session)
                raise e
        return render_template('admin/manage_index_page.jinja2', **context)
    else:
        raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))


@admin_bp.route('/admin/sst_import_page', methods=['GET', 'POST'])
@login_required
def sst_import_page():
    """Import Word Document, translate it and store in database."""
    """
     Route: '/admin/sst_import_page' => import_docx_and_add_to_db
     Template: import_docx.jinja2
     Form: import_docx_form.py
     Processor: import_docx_and_add_to_db.py
    """
    return build_route('admin/import_docx.jinja2', ImportMSWordDocForm(), import_docx_and_add_to_db,
                       '/admin/sst_import_page')()


@admin_bp.route('/admin/manageTemplate', methods=['GET', 'POST'])
@login_required
def make_story_json_template():
    """
     Route: '/admin/manageTemplate' => make_story_json_template
     Template: json_make_template.jinja2
     Form: db_manage_templates_form.py
     Processor: manage_json_template.py
    """
    return build_route('admin/json_make_template.jinja2', DBJSONManageTemplatesForm(), manage_json_templates,
                       '/admin/manageTemplate')()


@admin_bp.route('/json', methods=['GET', 'POST'])
@login_required
def up_down_load_json_template():
    """
     Route: '/admin/json' => edit_json_file
     Template: json_edit.jinja2
     Form: edit_json_content_form.py
     Processor: edit_json_file.py
    """
    sst_admin_access_log.make_info_entry(f"Route: /admin/json/")
    form = DBJSONEditForm()
    db_exec = DBExec()
    try:
        if request.method == 'GET':
            context = dict()
            context['form'] = DBJSONEditForm()
        elif request.method == 'POST':
            context = dict()
            context['form'] = form
            if form.validate_on_submit():
                res = edit_json_file(db_exec, form)
                if res:
                    flash(f'JSON edit succeeded', 'success')
                else:
                    form.errors['submit'] = 'Error processing json_edit_page'
                    flash_errors(form)
        else:
            raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))
    except Exception as e:
        log_sst_error(sys.exc_info(), get_traceback=True)
        form.errors['submit'] = 'Error processing JSON_edit page'
        flash_errors(form)
    finally:
        db_exec.terminate()
        return render_template('admin/json_edit.jinja2', **context)  # Executed in all cases


@admin_bp.route('/admin/sst_import_database', methods=['GET', 'POST'])
@login_required
def sst_import_database():
    """Translate file to HTML and store in database."""
    """
     Route: '/admin/sst_import_database' => db_import_pages
     Template: import_database_functions.jinja2
     Form: import_database_functions_form.py
     Processor: db_import_pages.py
    """
    sst_admin_access_log.make_info_entry(f"Route: /admin/sst_import_database")
    if request.method == 'GET':
        context = dict()
        context['form'] = ImportDatabaseFunctionsForm()
        return render_template('admin/import_database_functions.jinja2', **context)
    elif request.method == 'POST':
        form = ImportDatabaseFunctionsForm()
        context = dict()
        context['form'] = form
        if form.validate_on_submit():
            db_session = create_session(get_engine())
            function = form.work_function.data
            if function == 'imp_pages':
                mgr = ImportPageData(db_session)
                mgr.import_useable_pages_from_wp_database()
                close_session(db_session)
                flash('You were successful', 'success')
                return render_template('admin/import_database_functions.jinja2', **context)  # redirect to success url
            elif function == 'import_photos':
                mgr = ImportPhotoData(db_session)
                mgr.import_all_galleries()
                mgr.import_all_photos()
                close_session(db_session)
                flash('You were successful', 'success')
                return render_template('admin/import_database_functions.jinja2', **context)  # redirect to success url

        flash_errors(form)
        return render_template('admin/import_database_functions.jinja2', **context)
    else:
        raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))


@admin_bp.route('/manage_photos', methods=['GET', 'POST'])
@login_required
def manage_photos():
    """
     Route: '/admin/manage_photos' => manage_photo_functions
     Template: manage_photos.jinja2
     Form: manage_photo_functions_form.py
     Processor: manage_photo_functions.py
    """
    return build_route('admin/manage_photos.jinja2', DBPhotoManageForm(), manage_photo_functions, '/manage_photos')()


@admin_bp.route('/admin/manage_page_data', methods=['GET', 'POST'])
@login_required
def manage_page_data():
    """
    Route: '/admin/get_database_data' => get_database_data
    Template: db_manage_pages.jinja2
    Form: get_database_data_form.py
    Processor: manage_page_data_form.py
    """
    route_name = 'admin/manage_page_data'
    processing_form = DBManagePages()
    template = 'admin/db_manage_pages.jinja2'
    processing_function = db_manage_pages

    db_exec = DBExec()
    sst_admin_access_log.make_info_entry(f"Route: {route_name}")
    try:
        if request.method == 'GET':
            context = dict()
            context['form'] = processing_form
            result = ('GET', 'succeed', template, context)
        elif request.method == 'POST':
            context = dict()
            context['form'] = processing_form
            result = ('POST', 'fail', template, context)  # In case of execption in validation
            if processing_form.validate_on_submit(db_exec):
                result = processing_function(db_exec, processing_form)
                if type(result) is Response or type(result) is str:
                    # This allows the response to be created in the support code - such as send_file.
                    pass
                elif result:
                    result = ('POST', 'succeed', template, context)
                else:
                    result = ('POST', 'fail', template, context)
            else:
                result = ('POST', 'fail', template, context)
        else:
            raise RequestInvalidMethodError('System Error: Invalid method type: {}'.format(request.method))
    finally:
        if type(result) == Response or type(result) is str:
            pass  # Actual result generally from lower code such as making a send-file
        elif result[0] == 'GET' or processing_form.errors:
            flash_errors(processing_form)
            result = render_template(result[2], **result[3])
        elif result[1] == 'fail' and not processing_form.errors:
            flash('Failed - no message given', 'error')
            result = render_template(result[2], **result[3])
        else:
            flash('Successful', 'success')
            result = render_template(result[2], **result[3])
        db_exec.terminate()
        return result


def build_route(template, processing_form, processing_function, route_name):
    def route():
        db_exec = DBExec()
        sst_admin_access_log.make_info_entry(f"Route: {route_name}")
        try:
            if request.method == 'GET':
                context = dict()
                context['form'] = processing_form
                result = ('GET', 'succeed', template, context)
            elif request.method == 'POST':
                context = dict()
                context['form'] = processing_form
                result = ('POST', 'fail', template, context)        # In case of execption in validation
                if processing_form.validate_on_submit(db_exec):
                    result = processing_function(db_exec, processing_form)
                    if type(result) is Response:
                        # This allows the response to be created in the support code - such as send_file.
                        pass
                    elif result:
                        result = ('POST', 'succeed', template, context)
                    else:
                        result = ('POST', 'fail', template, context)
                else:
                    result = ('POST', 'fail', template, context)
            else:
                raise RequestInvalidMethodError('System Error: Invalid method type: {}'.format(request.method))
        finally:
            if type(result) == Response:
                pass  # Actual result generally from lower code such as making a send-file
            elif result[0] == 'GET' or processing_form.errors:
                flash_errors(processing_form)
                result = render_template(result[2], **result[3])
            elif result[1] == 'fail' and not processing_form.errors:
                flash('Failed - no message given', 'error')
                result = render_template(result[2], **result[3])
            else:
                flash('Successful', 'success')
                result = render_template(result[2], **result[3])
            db_exec.terminate()
            return result

    return route

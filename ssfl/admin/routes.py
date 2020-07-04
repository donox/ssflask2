import os
import mimetypes
import dateutil.parser
from flask import Blueprint, render_template, request, abort, jsonify, flash, Response, send_from_directory
from flask import current_app as app
from flask_user import roles_required

from config import Config
from db_mgt.db_exec import DBExec
from db_mgt.setup import get_engine, create_session, close_session
from ssfl import sst_admin_access_log
from ssfl.admin.import_word_docx import import_docx_and_add_to_db
from utilities.sst_exceptions import RequestInvalidMethodError
from .edit_database_file import edit_database_file
from .forms.manage_json_templates import DBJSONManageTemplatesForm
from .forms.edit_db_content_form import DBContentEditForm
from .forms.import_word_doc_form import ImportMSWordDocForm
from .forms.manage_calendar_form import ManageCalendarForm
from .forms.manage_index_pages_form import ManageIndexPagesForm
from .forms.manage_photo_functions_form import DBPhotoManageForm
from .forms.miscellaneous_functions_form import MiscellaneousFunctionsForm
from .forms.get_database_data_form import DBGetDatabaseData
from .forms.make_page_cells_form import MakePageCells
from ssfl.sysadmin.forms.manage_files_form import ManageFilesForm
from .manage_events.event_retrieval_support import SelectedEvents
from .get_database_data import db_manage_pages
from .manage_events.manage_calendar import manage_calendar
from .manage_index_pages import DBManageIndexPages
from .manage_json_templates import manage_json_templates
from .manage_photo_functions import manage_photo_functions
from .miscellaneous_functions import miscellaneous_functions
from .forms.manage_admin_reports_form import ManageAdminReportsForm
from .manage_admin_reports import manage_admin_reports
from .make_page_cells import make_page_cells

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


@admin_bp.route('/test', methods=['GET'])
@roles_required(['SysAdmin',  'Admin'])
def test():
    sst_admin_access_log.make_info_entry(f"Route: /test")

    return app.send_static_file('dist/index.html')


@admin_bp.route('/run_ace', methods=['GET'])
@roles_required(['SysAdmin',  'Admin'])
def run_ace():
    sst_admin_access_log.make_info_entry(f"Route: /admin/run_ace")
    context = dict()
    return render_template('/admin/run_ace.jinja2', **context)


@admin_bp.route('/run_js_test', methods=['GET'])
@roles_required(['SysAdmin',  'Admin'])
def run_js_test():
    sst_admin_access_log.make_info_entry(f"Route: /admin/run_js_test")
    context = dict()
    return render_template('/admin/run_js_test.jinja2', **context)


@admin_bp.route('/admin/delete_row', methods=['POST'])
@roles_required(['SysAdmin',  'Admin'])
def delete_row():
    db_exec = DBExec()
    context = dict()
    context['form'] = DBGetDatabaseData()
    sst_admin_access_log.make_info_entry(f"Route: /admin/delete_row")
    table_type = request.form['table']
    row_id = request.form['row_id']
    if table_type == 'page':
        page_mgr = db_exec.create_page_manager()
        page_mgr.delete_page(row_id, None)
    elif table_type == 'photo':
        photo_mgr = db_exec.create_sst_photo_manager()
        photo_mgr.delete_photo(row_id)
    return render_template('admin/db_get_database_data.jinja2', **context)

@admin_bp.route('/admin/delete_file', methods=['POST'])
@roles_required(['SysAdmin',  'Admin'])
def delete_file():
    try:
        db_exec = DBExec()
        context = dict()
        form = ManageFilesForm()
        context['form'] = form
        file = request.form['filename']
        directory = request.form['directory']
        filepath = directory + file
        sst_admin_access_log.make_info_entry(f"Route: /admin/delete_file: {filepath}")
        if not os.path.exists(filepath):
            form.errors['File Existence'] = [f'File: {filepath} does not exist']
        else:
            os.remove(filepath)
        return render_template('sysadmin/manage_files.jinja2', **context)
    except Exception as e:
        foo = 3
    finally:
        db_exec.terminate()


@admin_bp.route('/admin/events', methods=['GET'])
@roles_required(['SysAdmin',  'Admin'])
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


@admin_bp.route('/sys_download_file/', methods=['GET', 'POST'])
@roles_required('User')
def sst_download_page():
    """Download a page using send_file. """
    db_exec = DBExec()
    try:
        directory = request.args['directory']
        filename = request.args['filename']
        mime = mimetypes.guess_type(filename)
        # log_request(f'Download page: {filename} from  {directory}', 'download', context)
        return send_from_directory(directory, filename, mimetype=mime[0], as_attachment=True,
                                   attachment_filename=filename)
    except Exception as e:
        foo = 3
    finally:
        db_exec.terminate()


def _has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)

@admin_bp.route('/admin/make_page_cells', methods=['GET', 'POST'])
@roles_required(['SysAdmin',  'Admin'])
def sst_make_page_cells():
    """Transfer content to-from DB for local editing."""
    """
     Route: '/admin/make_page_cells' => sst_make_page_cells
     Template: make_page_cells.jinja2
     Form: make_page_cells_form.py
     Processor: make_page_cells.py
    """
    return build_route('admin/make_page_cells.jinja2', MakePageCells(), make_page_cells, '/admin/make_page_cells')()

@admin_bp.route('/admin/edit', methods=['GET', 'POST'])
@roles_required(['SysAdmin',  'Admin'])
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
@roles_required(['SysAdmin',  'Admin'])
def sst_admin_calendar():
    """Transfer content to-from DB for local editing."""
    """
     Route: '/admin/calendar' => manage_calendar
     Template: calendar.jinja2
     Form: manage_calendar_form.py
     Processor: manage_calendar.py
    """
    return build_route('admin/calendar.jinja2', ManageCalendarForm(), manage_calendar, '/admin/calendar')()


ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'csv', 'toml'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@admin_bp.route('/admin/sst_miscellaneous', methods=['GET', 'POST'])
@roles_required(['SysAdmin',  'Admin'])
def sst_miscellaneous():
    """Translate file to HTML and store in database."""
    """
     Route: '/admin/sst_miscellaneous' => miscellaneous_functions
     Template: miscellaneous_functions.jinja2
     Form: manage_photos_form.py
     Processor: miscellaneous_functions.py
    """
    return build_route('admin/miscellaneous_functions.jinja2', MiscellaneousFunctionsForm(), miscellaneous_functions,
                       '/admin/sst_miscellaneous')()


@admin_bp.route('/admin/manage_index_page', methods=['GET', 'POST'])
@roles_required(['SysAdmin',  'Admin'])
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
@roles_required(['SysAdmin',  'Admin'])
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
@roles_required(['SysAdmin',  'Admin'])
def make_story_json_template():
    """
     Route: '/admin/manageTemplate' => make_story_json_template
     Template: json_make_template.jinja2
     Form: db_manage_templates_form.py
     Processor: manage_json_template.py
    """
    return build_route('admin/json_make_template.jinja2', DBJSONManageTemplatesForm(), manage_json_templates,
                       '/admin/manageTemplate')()


@admin_bp.route('/manage_photos', methods=['GET', 'POST'])
@roles_required(['SysAdmin',  'Admin'])
def manage_photos():
    """
     Route: '/admin/manage_photos' => manage_photo_functions
     Template: manage_photos.jinja2
     Form: manage_photo_functions_form.py
     Processor: manage_photo_functions.py
    """
    return build_route('admin/manage_photos.jinja2', DBPhotoManageForm(), manage_photo_functions, '/manage_photos')()


@admin_bp.route('/admin/manage_page_data', methods=['GET', 'POST'])
@roles_required(['SysAdmin',  'Admin'])
def manage_page_data():
    """
    Route: '/admin/get_database_data' => get_database_data
    Template: db_get_database_data.jinja2
    Display:  db_display_database_data.jinja2
    Form: get_database_data_form.py
    Processor: db_manage_pages.py
    """
    return build_route('admin/db_get_database_data.jinja2', DBGetDatabaseData(), db_manage_pages,
                       '/admin/get_database_data')()

@admin_bp.route('/admin/make_report', methods=['GET', 'POST'])
@roles_required(['SysAdmin',  'Admin'])
def make_admin_report():
    """
    Route: '/admin/make_report' => manage_admin_reports
    Template: make_report.jinja2
    Display:  display_admin_report.jinja2
    Form: manage_admin_reports_form.py
    Processor: manage_admin_reports.py
    """
    return build_route('admin/manage_admin_reports.jinja2', ManageAdminReportsForm(), manage_admin_reports,
                       '/admin/make_report')()


def build_route(template, processing_form, processing_function, route_name):
    def route():
        db_exec = DBExec()
        db_exec.set_current_form(processing_form)
        context = dict()
        context['form'] = processing_form
        sst_admin_access_log.make_info_entry(f"Route: {route_name}")
        try:
            if request.method == 'GET':
                result = ('GET', 'succeed', template, context)
            elif request.method == 'POST':
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
                flash_errors(processing_form)
                flash('Successful', 'success')
                result = render_template(result[2], **result[3])
            db_exec.terminate()
            return result

    return route

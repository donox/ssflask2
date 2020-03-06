import os
import sys
from ssfl import sst_syslog, sst_admin_access_log
from utilities.sst_exceptions import log_sst_error, SiteObjectNotFoundError, RequestInvalidMethodError
from utilities.miscellaneous import get_temp_file_name
import dateutil.parser
from flask import Blueprint, render_template, url_for, request, send_file, \
    abort, jsonify, redirect, flash
from flask import current_app as app
from flask_login import login_required
from werkzeug.utils import secure_filename
import tempfile

from config import Config
from db_mgt.photo_tables import Photo
from db_mgt.setup import get_engine, create_session, close_session
from .edit_local_file import edit_database_file
from .edit_json_file import edit_json_file
from .forms.edit_db_content_form import DBContentEditForm
from .forms.manage_calendar_form import ManageCalendarForm
from .forms.miscellaneous_functions_form import MiscellaneousFunctionsForm
from .forms.index_pages_form import ManageIndexPagesForm
from .forms.import_word_doc_form import ImportMSWordDocForm
from .forms.edit_db_json_content_form import DBJSONEditForm
from .manage_events.manage_calendar import manage_calendar
from .manage_events.event_retrieval_support import EventsInPeriod
from .miscellaneous_functions import miscellaneous_functions, import_docx_and_add_to_db
from .manage_index_pages import DBManageIndexPages
from utilities.sst_exceptions import log_sst_error

# Set up a Blueprint
admin_bp = Blueprint('admin_bp', __name__,
                     template_folder='templates',
                     static_folder='static')


def flash_errors(form):
    """Flashes form errors"""
    for field, errors in form.errors.items():
        for error in errors:
            flash(u"routes - Error in the %s field - %s" % (getattr(form, field).label.text,  error), 'error')

@admin_bp.route('/downloads/<string:file_path>', methods=['GET'])
@login_required
def get_download(file_path):
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
    try:
        args = request.args
        start = dateutil.parser.isoparse(args['start'])
        end = dateutil.parser.isoparse(args['end'])
        db_session = create_session(get_engine())
        audiences = [args['audience']]
        categories = [args['category']]
        event_class = EventsInPeriod(db_session, start, end, audiences, categories)
        events = event_class.get_events_as_dict()
        close_session(db_session)
        return jsonify(events)
    except Exception as e:  # Normally occurs if there are no events to show
        close_session(db_session)
        return jsonify({})


@admin_bp.route('/getimage/<path:image_path>', methods=['GET'])
def get_image(image_path):
    sst_admin_access_log.make_info_entry(f"Route: /admin/get_image/{image_path}")
    path = Config.USER_DIRECTORY_IMAGES + image_path
    args = request.args
    width = int(args['w'])          # TODO: Change to width/height and in picture.jinja2
    height = int(args['h'])
    db_session = create_session(get_engine())
    fl = f'Photo {path} not available'
    try:
        photo = Photo.get_photo_from_path(db_session, path)
        if photo:
            photo_string = photo.get_resized_photo(db_session, width=width, height=height)
            close_session(db_session)
            photo_string.seek(0)
            return send_file(photo_string, mimetype='image/jpeg')
    except AttributeError as e:
        close_session(db_session)
        return abort(404, "Screwed up")
    except Exception as e:
        close_session(db_session)
        raise e


@admin_bp.route('/admin/test', methods=['GET'])
def admin():
    """Admin page route."""
    sst_admin_access_log.make_info_entry("Route: /admin/test")
    try:
        raise SiteObjectNotFoundError("Hi", "Boo", "baz")
    except SiteObjectNotFoundError as e:
        log_sst_error(e, "testing error processing")
    return render_template('admin/test.html')


def has_no_empty_params(rule):
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
        if "GET" in rule.methods and has_no_empty_params(rule):
            url = url_for(rule.endpoint, **(rule.defaults or {}))
            links.append((url, rule.endpoint, rule.methods, rule.arguments))
    for x in links:
        print(x)
    foo = 3  # TODO: render links in template


@admin_bp.route('/admin/edit', methods=['GET', 'POST'])
@login_required
def sst_admin_edit():
    """Transfer content to-from DB for local editing."""
    sst_admin_access_log.make_info_entry(f"Route: /admin/ss_admin_edit")
    if request.method == 'GET':
        context = dict()
        context['form'] = DBContentEditForm()
        return render_template('admin/edit.jinja2', **context)
    elif request.method == 'POST':
        form = DBContentEditForm()
        context = dict()
        context['form'] = form
        if form.validate_on_submit():
            db_session = create_session(get_engine())
            res = edit_database_file(db_session, form)
            close_session(db_session)
            if res:
                return render_template('admin/edit.jinja2', **context)  # redirect to success url
        return render_template('admin/edit.jinja2', **context)
    else:
        raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))


@admin_bp.route('/admin/calendar', methods=['GET', 'POST'])
@login_required
def sst_admin_calendar():
    """Transfer content to-from DB for local editing."""
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
            if res:
                return render_template('admin/calendar.jinja2', **context)  # redirect to success url
        return render_template('admin/calendar.jinja2', **context)
    else:
        raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))


@admin_bp.route('/admin/upload_form', methods=['GET', 'POST'])
def upload_form():
    sst_admin_access_log.make_info_entry(f"Route: /admin/upload_form")
    return render_template('admin/upload.html')


ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@admin_bp.route('/upload_file', methods=['POST'])
@login_required
def upload_file():
    """Upload file to system file directory."""
    sst_admin_access_log.make_info_entry(f"Route: /admin/upload_file")
    if request.method == 'POST':
        upload_type = request.form['upload_type']
        # check if the post request has the file part
        if upload_type not in ['docx']:
            flash('Improper file type', 'error')
            return redirect('/upload_form')
        if 'file' not in request.files:
            flash('No file part', 'error')
            return redirect('/upload_form')
        file = request.files['file']
        if file.filename == '':
            flash('No file selected for uploading', 'error')
            return redirect('/upload_form')
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(Config.USER_PAGE_MASTERS, filename)
            file.save(filepath)
            flash('File successfully uploaded', 'success')
            return redirect('/upload_form')
        else:
            flash('Allowed file types are txt, pdf, png, jpg, jpeg, gif')
        return redirect('/upload_form')


@admin_bp.route('/admin/sst_miscellaneous', methods=['GET', 'POST'])
@login_required
def sst_miscellaneous():
    """Translate file to HTML and store in database."""
    sst_admin_access_log.make_info_entry(f"Route: /admin/translate_to_html")
    if request.method == 'GET':
        context = dict()
        context['form'] = MiscellaneousFunctionsForm()
        return render_template('admin/miscellaneous_functions.jinja2', **context)
    elif request.method == 'POST':
        form = MiscellaneousFunctionsForm()
        context = dict()
        context['form'] = form
        if form.validate_on_submit():
            db_session = create_session(get_engine())
            func, res = miscellaneous_functions(db_session, form)
            close_session(db_session)
            if func in ['dpdb', 'df'] and res:
                flash('You were successful', 'success')
                return render_template('admin/miscellaneous_functions.jinja2', **context)  # redirect to success url
            else:
                return send_file(res, mimetype="text/csv", as_attachment=True)
        flash_errors(form)
        return render_template('admin/miscellaneous_functions.jinja2', **context)
    else:
        raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))


@admin_bp.route('/admin/manage_index_page', methods=['GET', 'POST'])
@login_required
def manage_index_page():
    """Manage Index Page CRUD and Index Items CRUD."""
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
    form = ImportMSWordDocForm()
    context = dict()
    try:
        sst_admin_access_log.make_info_entry(f"Route: /admin/sst_import_page")
        if request.method == 'GET':
            context['form'] = ImportMSWordDocForm()
            return render_template('admin/import_docx.jinja2', **context)
        elif request.method == 'POST':
            context['form'] = form
            db_session = create_session(get_engine())
            if form.validate_on_submit(db_session):
                file = form.file_name.data
                secure_filename(file.filename)
                file_path = get_temp_file_name('word', 'docx')
                file.save(file_path)
                res = import_docx_and_add_to_db(db_session, form, file_path)
                close_session(db_session)
                if res:
                    flash(f'You were successful in importing {file}', 'success')
                    return render_template('admin/import_docx.jinja2', **context)  # redirect to success url
            else:
                close_session(db_session)
            flash_errors(form)
            return render_template('admin/import_docx.jinja2', **context)
        else:
            raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))
    except Exception as e:
        log_sst_error(sys.exc_info(), get_traceback=True)
    finally:
        form.errors['submit'] = 'Error processing sst_import_page'
        flash_errors(form)
        return render_template('admin/import_docx.jinja2', **context)


@admin_bp.route('/json', methods=['GET', 'POST'])
@login_required
def add_json_template():
    sst_admin_access_log.make_info_entry(f"Route: /admin/json/")
    # path = Config.USER_DIRECTORY_BASE + file_path
    if request.method == 'GET':
        context = dict()
        context['form'] = DBJSONEditForm()
        return render_template('admin/json_edit.jinja2', **context)
    elif request.method == 'POST':
        form = DBJSONEditForm()
        context = dict()
        context['form'] = form
        if form.validate_on_submit():
            db_session = create_session(get_engine())
            res = edit_json_file(db_session, form)
            close_session(db_session)
            if res:
                return render_template('admin/json_edit.jinja2', **context)  # redirect to success url
        return render_template('admin/json_edit.jinja2', **context)
    else:
        raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))


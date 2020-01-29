from flask import Flask, Blueprint, render_template, url_for, request, send_file, \
    render_template_string, abort, jsonify, redirect, flash
from flask_login import login_required
from flask import current_app as app
from flask_uploads import secure_filename
from db_mgt.setup import get_engine, create_session, close_session
from .forms.edit_db_content_form import DBContentEditForm
from .forms.manage_calendar_form import DBManageCalendarForm
from .forms.process_page_masters_form import DBTranslateDocxToPage
from wtforms.validators import ValidationError
from .edit_local_file import edit_database_file
from .process_page_masters import translate_docx_and_add_to_db
from .manage_events.manage_calendar import manage_calendar
from config import Config
import os
from db_mgt.photo_tables import Photo
import datetime as dt
import dateutil.parser
from .manage_events.retrieval_support import EventsInPeriod

import flask_uploads

# Set up a Blueprint
admin_bp = Blueprint('admin_bp', __name__,
                     template_folder='templates',
                     static_folder='static')


@admin_bp.route('/downloads/<string:file_path>', methods=['GET'])
@login_required
def get_download(file_path):
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
    path = Config.USER_DIRECTORY_IMAGES + image_path
    args = request.args
    width = int(args['w'])
    height = int(args['h'])
    db_session = create_session(get_engine())
    photo = Photo.get_photo_from_path(db_session, path)
    fl = photo.get_resized_photo(db_session, width=width, height=height)
    close_session(db_session)
    return send_file(fl, mimetype='image/jpeg')


@admin_bp.route('/admin/test', methods=['GET'])
def admin():
    """Admin page route."""
    print("Came here")
    return render_template('admin/test.html')


def has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)


@admin_bp.route('/site-map')
def site_map():
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
    if request.method == 'GET':
        context = dict()
        context['form'] = DBContentEditForm()
        return render_template('admin/edit.html', **context)
    elif request.method == 'POST':
        form = DBContentEditForm()
        context = dict()
        context['form'] = form
        if form.validate_on_submit():
            db_session = create_session(get_engine())
            res = edit_database_file(db_session, form)
            close_session(db_session)
            if res:
                return render_template('admin/edit.html', **context)  # redirect to success url
        return render_template('admin/edit.html', **context)
    else:
        raise ValueError('Invalid method type: {}'.format(request.method))


@admin_bp.route('/admin/calendar', methods=['GET', 'POST'])
@login_required
def sst_admin_calendar():
    """Transfer content to-from DB for local editing."""
    if request.method == 'GET':
        context = dict()
        context['form'] = DBManageCalendarForm()
        return render_template('admin/calendar.html', **context)
    elif request.method == 'POST':
        form = DBManageCalendarForm()
        context = dict()
        context['form'] = form
        if form.validate_on_submit():
            db_session = create_session(get_engine())
            res = manage_calendar(db_session, form)
            close_session(db_session)
            if res:
                return render_template('admin/calendar.html', **context)  # redirect to success url
        return render_template('admin/calendar.html', **context)
    else:
        raise ValueError('Invalid method type: {}'.format(request.method))


@admin_bp.route('/upload_form', methods=['GET', 'POST'])
def upload_form():
    return render_template('admin/upload.html')


ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@admin_bp.route('/upload_file', methods=['POST'])
@login_required
def upload_file():
    if request.method == 'POST':
        upload_type = request.form['upload_type']
        # check if the post request has the file part
        if upload_type not in ['docx']:
            flash('Improper file type')
            return redirect('/upload_form')
        if 'file' not in request.files:
            flash('No file part')
            return redirect('/upload_form')
        file = request.files['file']
        if file.filename == '':
            flash('No file selected for uploading')
            return redirect('/upload_form')
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(Config.USER_PAGE_MASTERS, filename)
            file.save(filepath)
            flash('File successfully uploaded')
            return redirect('/upload_form')
        else:
            flash('Allowed file types are txt, pdf, png, jpg, jpeg, gif')
        return redirect('/upload_form')


@admin_bp.route('/admin/translate_to_html', methods=['GET', 'POST'])
@login_required
def translate_to_html():
    """Translate file to HTML and store in database."""
    if request.method == 'GET':
        context = dict()
        context['form'] = DBTranslateDocxToPage()
        return render_template('admin/docx_to_db.html', **context)
    elif request.method == 'POST':
        form = DBTranslateDocxToPage()
        context = dict()
        context['form'] = form
        if form.validate_on_submit():
            db_session = create_session(get_engine())
            res = translate_docx_and_add_to_db(db_session, form)
            close_session(db_session)
            if res:
                return render_template('admin/docx_to_db.html', **context)  # redirect to success url
        return render_template('admin/docx_to_db.html', **context)
    else:
        raise ValueError('Invalid method type: {}'.format(request.method))
# app.register_blueprint(admin_bp)

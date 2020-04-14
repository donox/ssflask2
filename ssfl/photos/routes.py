from flask import Blueprint, render_template, request, send_file, \
    abort, flash, render_template_string
from flask_login import login_required
from db_mgt.db_exec import DBExec
from ssfl import sst_admin_access_log
from utilities.toml_support import dict_to_toml_file
from .forms.manage_photos_form import ManagePhotosForm
from .manage_photo_metadata import manage_photo_metadata
from .upload_photos import upload_photo_file

# Set up a Blueprint
photo_bp = Blueprint('photo_bp', __name__,
                     template_folder='templates',
                     static_folder='static')


def flash_errors(form):
    """Flashes form errors"""
    for field, errors in form.errors.items():
        for error in errors:
            if hasattr(form, field):
                flash(u"routes - Error in the %s field - %s" % (getattr(form, field).label.text, error), 'error')
            else:
                flash(u"%s error: %s" % (field, error))


@photo_bp.route('/photos/manage_photos', methods=['GET', 'POST'])
@login_required
def manage_photos():
    """Manage photos."""
    """
     Route: 'photo/manage_photos' => manage_photos
     Template: photo/manage_photos.jinja2
     Form: photo/manage_photos_form.py
     Processor: photo/manage_photos.py
    """
    sst_admin_access_log.make_info_entry(f"Route: /photos/manage_photos")
    db_exec = DBExec()
    result = None
    try:
        if request.method == 'GET':
            context = dict()
            context['form'] = ManagePhotosForm()
            result = render_template('photos/manage_photos.jinja2', **context)
        elif request.method == 'POST':
            form = ManagePhotosForm()
            context = dict()
            context['form'] = form
            if form.validate_on_submit():
                res = manage_photo_metadata(db_exec, form, request)
                if res:
                    if type(res) is tuple:
                        file_path, photo_metadata, toml_download_name = res
                        dict_to_toml_file(photo_metadata, file_path)
                        result = send_file(file_path, mimetype='application/octet', as_attachment=True,
                                           attachment_filename=toml_download_name)
                    elif type(res) is bool:
                        if not res:
                            flash(f'Unuccessful.', 'fail')
                        else:
                            flash(f'Successful', 'success')
                        result = render_template('photos/manage_photos.jinja2', **context)
    except Exception as e:
        raise e
    finally:
        db_exec.terminate()
        return result


@photo_bp.route('/photos/upload_photos', methods=['GET', 'POST'])
@login_required
def upload_photos():
    """Upload group of photos and build meta information collection."""
    """
     Route: 'photo/upload_photos' => upload_photos
     Template: photo/upload_photos.jinja2
     Form: photo/manage_photos_form.py
     Processor: photo/upload_photos.py
    """

    # CONFIG LOC FOR PHOTOS: UPLOADED_PHOTOS_DEST

    sst_admin_access_log.make_info_entry(f"Route: /photos/upload_photos")
    db_exec = DBExec()
    try:
        if request.method == 'GET':
            context = dict()
            context['form'] = ManagePhotosForm()
            return render_template('photos/upload_photos.jinja2', **context)
        elif request.method == 'POST':
            gallery = request.form['gallery']
            if not gallery:
                abort(400)
            file = request.files['file']
            res = upload_photo_file(db_exec, gallery, file)
            if res:
                return render_template_string('<h4>Success</h4>')
            else:
                abort(400)
    except Exception as e:
        raise e
    finally:
        db_exec.terminate()


# @photo_bp.route('/downloads/<string:file_path>', methods=['GET'])
# @login_required
# def get_download(file_path):
#     sst_admin_access_log.make_info_entry(f"Route: /admin/get_download/{file_path}")
#     path = Config.USER_DIRECTORY_BASE + file_path
#     if os.path.exists(path):
#         with open(path, 'r') as fl:
#             return send_file(fl, mimetype='application/octet')
#     else:
#         abort(404)
# 
# 
# @photo_bp.route('/getimage/<path:image_path>', methods=['GET'])
# def get_image(image_path):
#     sst_admin_access_log.make_info_entry(f"Route: /admin/get_image/{image_path}")
#     db_exec = DBExec()
#     try:
#         path = Config.USER_DIRECTORY_IMAGES + image_path
#         if os.path.exists(path):
#             return Response(open(path, 'rb'), direct_passthrough=True)
#         else:
#             return abort(404, f'File: {image_path} does not exist.')
# 
#         # No need to resize as browser seems to handle it just fine
#         args = request.args
#         width = 200
#         height = 200
#         if args['w'] and args['w'] != 'None':
#             width = int(args['w'])  # TODO: Change to width/height and in picture.jinja2
#         if args['h'] and args['h'] != 'None':
#             height = int(args['h'])
#         fl = f'Photo {path} not available'
#         try:
#             photo_mgr = db_exec.create_photo_manager()
#             photo = photo_mgr.get_photo_from_path(path)
#             if photo:
#                 photo_string = photo_mgr.get_resized_photo(photo, width=width, height=height)
#                 photo_string.seek(0)
#                 wrapped_string = FileWrapper(photo_string)
#                 # Note:  this return can be removed if Werkzeug is upgraded to handle ByteIO objects
#                 # github.com/unbit/uwsgi/issues/1126
#                 return Response(wrapped_string, mimetype='image/jpeg', direct_passthrough=True)
#                 # return send_file(wrapped_string, mimetype='image/jpeg')
#         except AttributeError as e:
#             return abort(404, "Screwed up")
#     finally:
#         db_exec.terminate()


#
# @photo_bp.route('/photo/edit', methods=['GET', 'POST'])
# @login_required
# def sst_admin_edit():
#     """Transfer content to-from DB for local editing."""
#     """
#      Route: '/admin/edit' => edit_database_file
#      Template: edit.jinja2
#      Form: edit_db_content_form.py
#      Processor: edit_database_file.py
#     """
#     sst_admin_access_log.make_info_entry(f"Route: /admin/ss_admin_edit")
#     if request.method == 'GET':
#         context = dict()
#         context['form'] = DBContentEditForm()
#         return render_template('admin/edit.jinja2', **context)
#     elif request.method == 'POST':
#         form = DBContentEditForm()
#         context = dict()
#         context['form'] = form
#         if form.validate_on_submit():
#             db_session = create_session(get_engine())
#             res = edit_database_file(db_session, form)
#             close_session(db_session)
#             if res:
#                 return render_template('admin/edit.jinja2', **context)  # redirect to success url
#         return render_template('admin/edit.jinja2', **context)
#     else:
#         raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))

@photo_bp.route('/photo/upload_form', methods=['GET', 'POST'])
@login_required
def upload_form():
    # Used by upload_file below
    sst_admin_access_log.make_info_entry(f"Route: /admin/upload_form")
    return render_template('admin/upload.jinja2')


ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'csv', 'toml'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# @photo_bp.route('/upload_file', methods=['POST'])
# @login_required
# def upload_file():
#     """Upload file to system file directory."""
#     # This needs to be re-thought out - what/how are we handling uploads, how is the directory
#     # monitored, cleaned, ...  Need to tie to config entries and their use
#     sst_admin_access_log.make_info_entry(f"Route: /admin/upload_file")
#     if request.method == 'POST':
#         upload_type = request.form['upload_type']
#         # check if the post request has the file part
#         if upload_type not in ['docx', 'toml']:
#             flash('Improper file type', 'error')
#             return redirect('/upload_form')
#         if 'file' not in request.files:
#             flash('No file part', 'error')
#             return redirect('/upload_form')
#         file = request.files['file']
#         if file.filename == '':
#             flash('No file selected for uploading', 'error')
#             return redirect('/upload_form')
#         if file and allowed_file(file.filename):
#             filename = secure_filename(file.filename)
#             filepath = os.path.join(Config.USER_PAGE_MASTERS, filename)
#             file.save(filepath)
#             flash('File successfully uploaded', 'success')
#             return redirect('/upload_form')
#         else:
#             flash('Allowed file types are txt, pdf, png, jpg, jpeg, gif')
#         return redirect('/upload_form')


# @photo_bp.route('/photo/sst_miscellaneous', methods=['GET', 'POST'])
# @login_required
# def sst_miscellaneous():
#     """Translate file to HTML and store in database."""
#     """
#      Route: '/admin/sst_miscellaneous' => miscellaneous_functions
#      Template: miscellaneous_functions.jinja2
#      Form: manage_photos_form.py
#      Processor: upload_photos.py
#     """
#     sst_admin_access_log.make_info_entry(f"Route: /admin/translate_to_html")
#     db_exec = DBExec()
#     try:
#         if request.method == 'GET':
#             context = dict()
#             context['form'] = UploadPhotosForm()
#             return render_template('admin/miscellaneous_functions.jinja2', **context)
#         elif request.method == 'POST':
#             form = UploadPhotosForm()
#             context = dict()
#             context['form'] = form
#             if form.validate_on_submit():
#                 func, res = miscellaneous_functions(db_exec, form)
#                 if func in ['dpdb', 'df'] and res:
#                     flash('You were successful', 'success')
#                     return render_template('admin/miscellaneous_functions.jinja2', **context)  # redirect to success url
#                 else:
#                     return send_file(res, mimetype="text/csv", as_attachment=True)
#             flash_errors(form)
#             return render_template('admin/miscellaneous_functions.jinja2', **context)
#         else:
#             raise RequestInvalidMethodError('Invalid method type: {}'.format(request.method))
#     finally:
#         db_exec.terminate()



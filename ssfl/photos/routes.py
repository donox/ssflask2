from flask import Blueprint, render_template, request, send_file, \
    abort, flash, render_template_string
from flask_login import login_required
from db_mgt.db_exec import DBExec
from ssfl import sst_admin_access_log
from utilities.toml_support import dict_to_toml_file
from .forms.manage_photos_form import ManagePhotosForm
from .manage_photo_metadata import manage_photo_metadata
from .upload_photos import upload_photo_file
from ssfl.admin.routes import build_route
from ssfl import sst_syslog
from config import Config

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
    return build_route('photos/manage_photos.jinja2', ManagePhotosForm(), manage_photo_metadata,
                       '/photos/manage_photos')()


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
            context['host'] = Config.SYSTEM_HOST
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
        sst_admin_access_log.make_error_entry(f'Exception: {e.args[0]}, {e.args[1]}\n')
        raise e
    finally:
        db_exec.terminate()

from flask import Flask, Blueprint, render_template, url_for, request, send_file, render_template_string
from flask_login import login_required
from flask import current_app as app
from db_mgt.setup import get_engine, create_session, close_session
from .forms.edit_db_content_form import DBContentEditForm
from wtforms.validators import ValidationError
from .edit_local_file import edit_database_file
from config import Config
import os
from db_mgt.photo_tables import Photo
from tempfile import NamedTemporaryFile


# Set up a Blueprint
admin_bp = Blueprint('admin_bp', __name__,
                     template_folder='templates',
                     static_folder='static')


@admin_bp.route('/getimage/<path:image_path>', methods=['GET'])
def get_image(image_path):
    path = Config.USER_DIRECTORY_IMAGES + image_path
    args = request.args
    width = int(args['w'])
    height = int(args['h'])
    db_session = create_session(get_engine())
    photo = Photo.get_photo_from_path(db_session, path)
    fl = photo.get_resized_photo(db_session,  width=width, height=height)
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
    foo = 3         # TODO: render links in template


@admin_bp.route('/admin/edit', methods=['GET', 'POST'])
# @login_required
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
                return render_template('admin/edit.html', **context)   # redirect to success url
        return render_template('admin/edit.html', **context)
    else:
        raise ValueError('Invalid method type: {}'.format(request.method))



# app.register_blueprint(admin_bp)

from flask import Flask, Blueprint, render_template, url_for, request
from flask_login import login_required
from flask import current_app as app
from db_mgt.setup import get_engine, create_session, close_session
from .forms.edit_db_content_form import DBContentEditForm
from wtforms.validators import ValidationError
from .edit_local_file import edit_database_file


# Set up a Blueprint
admin_bp = Blueprint('admin_bp', __name__,
                     template_folder='templates',
                     static_folder='static')


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

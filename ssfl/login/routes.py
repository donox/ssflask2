from flask import Blueprint, render_template_string, render_template, request, current_app, redirect
from flask_login import login_required
from flask_user import roles_required
from flask_user.user_manager__utils import current_user
from .forms import LoginForm

# Blueprint Configuration
login_bp = Blueprint('login_bp', __name__,
                     template_folder='templates',
                     static_folder='static')


@login_bp.route('/', methods=['GET', 'POST'])
def home_page():
    um = current_app.user_manager
    um.login_view()


@login_bp.route('/logout', methods=['GET', 'POST'])
def logout():
    um = current_app.user_manager
    login_form = um.LoginFormClass(request.form)
    um.logout_view()
    template_filename = um.USER_LOGIN_AUTH0_TEMPLATE if um.USER_ENABLE_AUTH0 else um.USER_LOGIN_TEMPLATE
    return render_template(template_filename,
                           form=login_form,
                           login_form=login_form)


# The Admin page requires an 'Admin' role.
@login_bp.route('/adminpage')
@roles_required('Admin')
def admin_page():
    return render_template_string("""
               {% extends "base/layout.jinja2" %}
               {% block content %}
                   <h2>Admin Page</h2>
                   <p><a href={{ url_for('user.login') }}>Sign in</a></p>
                   <p><a href={{ url_for('login_bp.home_page') }}>Home Page</a> (accessible to anyone)</p>
               {% endblock %}
               """)

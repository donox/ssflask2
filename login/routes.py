from flask import Blueprint, render_template_string
from flask_login import login_required
from flask_user import roles_required

# Blueprint Configuration
login_bp = Blueprint('login_bp', __name__,
                     template_folder='templates',
                     static_folder='static')



@login_bp.route('/')
def home_page():
    return render_template_string("""
               {% extends "flask_user_layout.html" %}
               {% block content %}
                   <h2>{%trans%}Home page{%endtrans%}</h2>
                   <p><a href={{ url_for('user.register') }}>{%trans%}Register{%endtrans%}</a></p>
                   <p><a href={{ url_for('user.login') }}>{%trans%}Sign in{%endtrans%}</a></p>
                   <p><a href={{ url_for('login_bp.home_page') }}>{%trans%}Home Page{%endtrans%}</a> (accessible to anyone)</p>
                   <p><a href={{ url_for('login_bp.member_page') }}>{%trans%}Member Page{%endtrans%}</a> (login_required: member@example.com / Password1)</p>
                   <p><a href={{ url_for('login_bp.admin_page') }}>{%trans%}Admin Page{%endtrans%}</a> (role_required: admin@example.com / Password1')</p>
                   <p><a href={{ url_for('user.logout') }}>{%trans%}Sign out{%endtrans%}</a></p>
               {% endblock %}
               """)


# The Members page is only accessible to authenticated users
@login_bp.route('/members')
@login_required
def member_page():
    return render_template_string("""
               {% extends "flask_user_layout.html" %}
               {% block content %}
                   <h2>{%trans%}Members page{%endtrans%}</h2>
                   <p><a href={{ url_for('user.register') }}>{%trans%}Register{%endtrans%}</a></p>
                   <p><a href={{ url_for('user.login') }}>{%trans%}Sign in{%endtrans%}</a></p>
                   <p><a href={{ url_for('home_page') }}>{%trans%}Home Page{%endtrans%}</a> (accessible to anyone)</p>
                   <p><a href={{ url_for('member_page') }}>{%trans%}Member Page{%endtrans%}</a> (login_required: member@example.com / Password1)</p>
                   <p><a href={{ url_for('admin_page') }}>{%trans%}Admin Page{%endtrans%}</a> (role_required: admin@example.com / Password1')</p>
                   <p><a href={{ url_for('user.logout') }}>{%trans%}Sign out{%endtrans%}</a></p>
               {% endblock %}
               """)


# The Admin page requires an 'Admin' role.
@login_bp.route('/admin')
@roles_required('Admin')
def admin_page():
    return render_template_string("""
               {% extends "flask_user_layout.html" %}
               {% block content %}
                   <h2>{%trans%}Admin Page{%endtrans%}</h2>
                   <p><a href={{ url_for('user.register') }}>{%trans%}Register{%endtrans%}</a></p>
                   <p><a href={{ url_for('user.login') }}>{%trans%}Sign in{%endtrans%}</a></p>
                   <p><a href={{ url_for('home_page') }}>{%trans%}Home Page{%endtrans%}</a> (accessible to anyone)</p>
                   <p><a href={{ url_for('member_page') }}>{%trans%}Member Page{%endtrans%}</a> (login_required: member@example.com / Password1)</p>
                   <p><a href={{ url_for('admin_page') }}>{%trans%}Admin Page{%endtrans%}</a> (role_required: admin@example.com / Password1')</p>
                   <p><a href={{ url_for('user.logout') }}>{%trans%}Sign out{%endtrans%}</a></p>
               {% endblock %}
               """)

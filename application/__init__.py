import datetime
from flask import Flask, request, render_template_string
from flask_babelex import Babel
from flask_sqlalchemy import SQLAlchemy

from flask_user import current_user, login_required, roles_required, UserManager, UserMixin

from sqlalchemy.ext.declarative import declarative_base

# Monkey-patch flask_mail to fix problem in configuration variable - line 548 - DEBUG being converted to int
import flask_mail as fm
from login import my_flask_mail as mfm
fm.Mail = mfm.Mail

Base = declarative_base()

# Globally accessible libraries
# login_manager = LoginManager()
db = SQLAlchemy()

def create_app():
    """ Flask application factory """

    # Create Flask app load app.config
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object('config.Config')

    # Initialize Flask-BabelEx
    babel = Babel(app)
    from login.models import User, Role

    # Initialize Flask-SQLAlchemy
    db.init_app(app)

    # Set up User Manager and (implicitly) Login Manager
    user_manager = UserManager(app, db, User, RoleClass=Role)

    # from .admin import routes as admin_routes
    # from .main import routes as main_routes
    from login import routes as login_routes

    # Register Blueprints
    # app.register_blueprint(main_routes.main_bp)
    # app.register_blueprint(admin_routes.admin_bp)
    app.register_blueprint(login_routes.login_bp)

    # # The Home page is accessible to anyone
    # @app.route('/')
    # def home_page():
    #     return render_template_string("""
    #             {% extends "flask_user_layout.html" %}
    #             {% block content %}
    #                 <h2>{%trans%}Home page{%endtrans%}</h2>
    #                 <p><a href={{ url_for('user.register') }}>{%trans%}Register{%endtrans%}</a></p>
    #                 <p><a href={{ url_for('user.login') }}>{%trans%}Sign in{%endtrans%}</a></p>
    #                 <p><a href={{ url_for('home_page') }}>{%trans%}Home Page{%endtrans%}</a> (accessible to anyone)</p>
    #                 <p><a href={{ url_for('member_page') }}>{%trans%}Member Page{%endtrans%}</a> (login_required: member@example.com / Password1)</p>
    #                 <p><a href={{ url_for('admin_page') }}>{%trans%}Admin Page{%endtrans%}</a> (role_required: admin@example.com / Password1')</p>
    #                 <p><a href={{ url_for('user.logout') }}>{%trans%}Sign out{%endtrans%}</a></p>
    #             {% endblock %}
    #             """)
    #
    # # The Members page is only accessible to authenticated users
    # @app.route('/members')
    # @login_required  # Use of @login_required decorator
    # def member_page():
    #     return render_template_string("""
    #             {% extends "flask_user_layout.html" %}
    #             {% block content %}
    #                 <h2>{%trans%}Members page{%endtrans%}</h2>
    #                 <p><a href={{ url_for('user.register') }}>{%trans%}Register{%endtrans%}</a></p>
    #                 <p><a href={{ url_for('user.login') }}>{%trans%}Sign in{%endtrans%}</a></p>
    #                 <p><a href={{ url_for('home_page') }}>{%trans%}Home Page{%endtrans%}</a> (accessible to anyone)</p>
    #                 <p><a href={{ url_for('member_page') }}>{%trans%}Member Page{%endtrans%}</a> (login_required: member@example.com / Password1)</p>
    #                 <p><a href={{ url_for('admin_page') }}>{%trans%}Admin Page{%endtrans%}</a> (role_required: admin@example.com / Password1')</p>
    #                 <p><a href={{ url_for('user.logout') }}>{%trans%}Sign out{%endtrans%}</a></p>
    #             {% endblock %}
    #             """)
    #
    # # The Admin page requires an 'Admin' role.
    # @app.route('/admin')
    # @roles_required('Admin')  # Use of @roles_required decorator
    # def admin_page():
    #     return render_template_string("""
    #             {% extends "flask_user_layout.html" %}
    #             {% block content %}
    #                 <h2>{%trans%}Admin Page{%endtrans%}</h2>
    #                 <p><a href={{ url_for('user.register') }}>{%trans%}Register{%endtrans%}</a></p>
    #                 <p><a href={{ url_for('user.login') }}>{%trans%}Sign in{%endtrans%}</a></p>
    #                 <p><a href={{ url_for('home_page') }}>{%trans%}Home Page{%endtrans%}</a> (accessible to anyone)</p>
    #                 <p><a href={{ url_for('member_page') }}>{%trans%}Member Page{%endtrans%}</a> (login_required: member@example.com / Password1)</p>
    #                 <p><a href={{ url_for('admin_page') }}>{%trans%}Admin Page{%endtrans%}</a> (role_required: admin@example.com / Password1')</p>
    #                 <p><a href={{ url_for('user.logout') }}>{%trans%}Sign out{%endtrans%}</a></p>
    #             {% endblock %}
    #             """)

    return app
from flask import Flask
from flask_babelex import Babel
from flask_sqlalchemy import SQLAlchemy
from flask_assets import Environment, Bundle
from flask_user import UserManager
from flask_migrate import Migrate

from sqlalchemy.ext.declarative import declarative_base
import platform

if platform.node() == 'Descartes':
    local_server = True
else:
    local_server = False

if not local_server:
    from pathlib import Path
    from dotenv import load_dotenv

    env_path = '/home/doxley/ssflask2/.env_PA'
    load_dotenv(dotenv_path=env_path)

# Monkey-patch flask_mail to fix problem in configuration variable - line 548 - DEBUG being converted to int
import flask_mail as fm
from login import my_flask_mail as mfm
fm.Mail = mfm.Mail

Base = declarative_base()

# Globally accessible libraries
# login_manager = LoginManager()
db = SQLAlchemy()


def create_app():
    """ Flask ssfl factory """

    # Create Flask app load app.config
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object('config.Config')

    # Initialize Flask-BabelEx
    babel = Babel(app)
    from db_mgt.models import User, Role

    # Set up Flask-Assets
    assets = Environment(app)

    # Initialize Flask-SQLAlchemy
    db.init_app(app)
    migrate = Migrate(app, db)

    # Set up User Manager and (implicitly) Login Manager
    user_manager = UserManager(app, db, User, RoleClass=Role)

    from .admin import routes as admin_routes
    from .main import routes as main_routes
    from login import routes as login_routes

    # Register Blueprints
    app.register_blueprint(main_routes.main_bp)
    app.register_blueprint(admin_routes.admin_bp)
    app.register_blueprint(login_routes.login_bp)

    # Create Static Bundles
    js_bundle = Bundle('js/*', 'dist/bundle.js', output='gen/packed.js')
    css_bundle = Bundle('css/*.css', output='gen/packed.css')
    assets.register('js_bundle', js_bundle)
    assets.register('css_bundle', css_bundle)

    return app


if not local_server:
    app = create_app()

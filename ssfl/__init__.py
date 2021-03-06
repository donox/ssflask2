from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_assets import Environment, Bundle
from flask_user import UserManager
# from flask_import UploadSet, configure_uploads, IMAGES, patch_request_class
from pathlib import Path
from dotenv import load_dotenv
from flask_dropzone import Dropzone
from flask_babelex import Babel
from flask_mail import Mail
from cache import cache
from linkages.persistence import GraphPersistence


from sqlalchemy.ext.declarative import declarative_base
import platform

local_server = True
if platform.node() == 'Descartes':
    env_path = '/home/don/devel/ssflask2/.env'
    load_dotenv(dotenv_path=env_path)

elif platform.node() == 'bill-XPS-8300':
    env_path = r'/home/donoxley/PycharmProjects/ssflask2/.env_SL'
    load_dotenv(dotenv_path=env_path)

elif platform.node() == 'glatz':
    env_path = r'C:\Users\glatz\PycharmProjects\devel\ssflask2\.env_SP'
    load_dotenv(dotenv_path=env_path)
else:
    local_server = False
    env_path = '/home/doxley/ssflask2/.env_PA'
    load_dotenv(dotenv_path=env_path)

# Config Loggers
from utilities.logging_support import SsTLogger

wsgi_logger = SsTLogger()
wsgi_logger.define_wsgi_logger()

sst_syslog = SsTLogger()
sst_syslog.define_file_logger('syslog')

sst_admin_access_log = SsTLogger()
sst_admin_access_log.define_file_logger('admin_access')

Base = declarative_base()

# Globally accessible libraries
# login_manager = LoginManager()
db = SQLAlchemy()


def create_app():
    """ Flask ssfl factory """

    # Create Flask app load app.config
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object('config.Config')

    # Initialize Flask Apps
    babel = Babel(app)

    from db_mgt.user_models import User, Role

    assets = Environment(app)
    mail = Mail()
    mail.init_app(app)

    db.init_app(app)
    # migrate = Migrate(app, db)  Not using alembic

    # Set up User Manager and (implicitly) Login Manager
    user_manager = UserManager(app, db, User, RoleClass=Role)

    # Init cache handling
    cache.init_app(app)

    # Init graph persistence
    graph_persistence = GraphPersistence(app)

    # Initialize DropZone photo/file uploading
    dropzone = Dropzone(app)
    # photos = UploadSet('photos', IMAGES)
    # configure_uploads(app, photos)
    # patch_request_class(app)  # set maximum file size, default is 16MB

    from .admin import routes as admin_routes
    from .main import routes as main_routes
    from ssfl.login import routes as login_routes
    from .photos import routes as photo_routes
    from .sysadmin import routes as sys_admin_routes

    # Register Blueprints
    app.register_blueprint(main_routes.main_bp)
    app.register_blueprint(admin_routes.admin_bp)
    app.register_blueprint(login_routes.login_bp)
    app.register_blueprint(photo_routes.photo_bp)
    app.register_blueprint(sys_admin_routes.sysadmin_bp)

    # Create Static Bundles
    # js_bundle = Bundle('js/*',  'gen/packed.js', output='gen/packed.js')
    # css_bundle = Bundle('gen/packed.css', output='gen/packed.css')
    # assets.register('js_bundle', js_bundle)
    # assets.register('css_bundle', css_bundle)

    return app

if not local_server:
    app = create_app()

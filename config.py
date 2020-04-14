import os


class DevConfig:
    pass


class Config:

    TESTING = os.environ.get('TESTING')
    DEBUG = os.environ.get('DEBUG')
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SESSION_COOKIE_NAME = os.environ.get('SESSION_COOKIE_NAME')
    SERVER_NAME = os.environ.get('SERVER_NAME')
    SESSION_TYPE = 'sqlalchemy'
    SESSION_PERMANENT = False
    LOG_DIRECTORY = os.environ.get('LOG_DIRECTORY')

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI')
    SQLALCHEMY_USERNAME = os.environ.get('SQLALCHEMY_USERNAME')
    SQLALCHEMY_PASSWORD = os.environ.get('SQLALCHEMY_PASSWORD')
    SQLALCHEMY_DATABASE_NAME = os.environ.get('SQLALCHEMY_DATABASE_NAME')
    SQLALCHEMY_TABLE = 'passwords_table - fix if used'
    SQLALCHEMY_DB_SCHEMA = 'public - fix if used'
    SQLALCHEMY_TRACK_MODIFICATIONS = os.environ.get('SQLALCHEMY_TRACK_MODIFICATIONS')
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_recycle': 280, 'pool_pre_ping': True}

    # Flask-Mail SMTP server settings
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 465
    MAIL_USE_SSL = True
    MAIL_USE_TLS = False
    MAIL_USERNAME = 'donoxley@gmail.com'
    MAIL_PASSWORD = 'sy7LJwjY'
    MAIL_DEFAULT_SENDER = '"Flask" <noreply@example.com>'

    # Flask-User settings
    USER_APP_NAME = "Sunnyside Times"  # Shown in email templates and page footers
    USER_ENABLE_EMAIL = True  # Enable email authentication   -- Setting while developing
    USER_ENABLE_USERNAME = True  # Enable username authentication
    USER_EMAIL_SENDER_NAME = USER_APP_NAME
    USER_EMAIL_SENDER_EMAIL = "noreply@example.com"

    # Flask-User endpoint settings - overrides values in user_manager_settings.
    # Additional endpoints are not shown here.
    USER_AFTER_FORGOT_PASSWORD_ENDPOINT = ''    #:
    USER_AFTER_LOGIN_ENDPOINT = 'main.sst_main'  #:
    USER_AFTER_LOGOUT_ENDPOINT = ''     #:

    # File System Stored files
    USER_DIRECTORY_BASE = os.environ.get('USER_DIRECTORY_BASE')
    USER_DOWNLOADABLE_FILES = USER_DIRECTORY_BASE + 'downloads/'
    USER_AUTO_GENERATED_PAGES = USER_DIRECTORY_BASE + 'gen_pages/'
    USER_PLOTS = USER_DIRECTORY_BASE + 'plots/'
    USER_DEFINITION_FILES = USER_DIRECTORY_BASE + 'definition_files/'
    # Config name assumed by Flask-Upload
    UPLOAD_FOLDER = USER_DIRECTORY_BASE + 'uploads/'
    # Storage for docx pages that master for html pages  -- Believe this is no longer used
    USER_PAGE_MASTERS = UPLOAD_FOLDER + 'page_masters/'
    UPLOADED_PHOTOS_DEST = USER_DIRECTORY_BASE + 'photo_uploads/'

    USER_DIRECTORY_STATIC = os.environ.get('USER_DIRECTORY_STATIC')
    USER_DIRECTORY_IMAGES = os.environ.get('USER_DIRECTORY_IMAGES')
    TEMP_COUNT = 50
    TEMP_CURRENT = 1
    TEMP_FILE_LOC = os.environ.get('TEMP_FILE_LOC')

    # NEEDED FOR FLASK-CLOUDY
    STORAGE_PROVIDER = 'LOCAL'
    STORAGE_CONTAINER = os.environ.get('STORAGE_CONTAINER')
    STORAGE_SECRET = ""
    STORAGE_SERVER = True

    # NEEDED FOR DROPZONE
    DROPZONE_UPLOAD_MULTIPLE = True
    DROPZONE_ALLOWED_FILE_CUSTOM = True
    DROPZONE_ALLOWED_FILE_TYPE = 'image/*'
    DROPZONE_REDIRECT_VIEW = 'photo_bp.dropzone_results'

    # Admin
    FLASK_ADMIN_SWATCH = 'cerulean'

    # Some standard things
    FLASK_ENV = DevConfig


class DevConfig:
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True
    ASSETS_DEBUG = True
    MAIL_DEBUG = 1


class ProdConfig:
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False

class TestConfig(Config):
    TESTING = True
    WTF_CSRF_ENABLED = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + '/home/don/devel/temp/testing.db'
    HASH_ROUNDS = 1

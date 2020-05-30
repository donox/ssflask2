from flask_testing.utils import TestCase
from pathlib import Path
from dotenv import load_dotenv
import platform

if platform.node() == 'Descartes':
    env_path = '/home/don/devel/ssflask2/.env'
elif platform.node() == 'glatz':
    env_path = r'C:\Users\glatz\PycharmProjects\devel\ssflask2\.env_SP'

load_dotenv(dotenv_path=env_path)

from ssfl import db
from ssfl import create_app as ca
app = ca()



class BaseTestCase(TestCase):
    """A base test case for flask-tracking."""

    def create_app(self):
        app.config.from_object('config.TestConfig')
        return app

    def setUp(self):
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

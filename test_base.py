from flask_testing.utils import TestCase
from pathlib import Path
from dotenv import load_dotenv

env_path = '/home/don/devel/ssflask2/.env'
load_dotenv(dotenv_path=env_path)

from ssfl import db
from ssfl import create_app as ca
app = ca()

# from ssfl.tests import test_main


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

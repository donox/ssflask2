from flask_testing.utils import TestCase
from pathlib import Path
from dotenv import load_dotenv




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

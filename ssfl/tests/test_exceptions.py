from test_base import BaseTestCase, app
from flask import url_for
from ssfl.main.multi_story_page import MultiStoryPage
from db_mgt.setup import create_session, get_engine
from utilities import sst_exceptions
import sys


class MainRoutesTests(BaseTestCase):
    def test_base_sstexception(self):
        try:
            with app.app_context():
                raise sst_exceptions.SSTException('SST Exception Test')
        except Exception as e:
            ex_class, ex_instance, trace = sys.exc_info()
            sst_exceptions.log_sst_error(sys.exc_info(), get_traceback=True)
            self.assertEqual(ex_class, sst_exceptions.SSTException, 'Invalid Class found')
            self.assertEqual(ex_instance.args[0], 'SST Exception Test', 'Invalid message found')


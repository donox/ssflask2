from test_base import BaseTestCase, app
from io import StringIO
import csv
from db_mgt.json_tables import JSONStorageManager
from db_mgt.setup import create_session, get_engine
from ssfl.main import multi_story_page as msp
from import_data import db_import_pages as dip


class TestJSONStorageManager(BaseTestCase):
    def test_get_fields_from_table(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPageData(db_session)
            fields = mgr.get_table_fields('wp_posts')
            self.assertEqual(len(fields), 23, 'Wrong number of fields returned')
        finally:
            db_session.close()

    def test_get_data_from_table(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPageData(db_session)
            for res in mgr.get_wp_post_data():
                for x, y in res:
                    self.assertEqual(x, 'ID', 'Wrong Field Found')
                    break
        finally:
            db_session.close()

    def test_get_username(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPageData(db_session)
            user = mgr.get_author(1)
            self.assertEqual(user, 'Don Oxley', 'Get username fails')
        finally:
            db_session.close()

    def test_get_pagename(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPageData(db_session)
            guid = mgr.get_row_from_id(143)[18]
            pagename = mgr.get_page_name(guid)
            self.assertEqual(pagename, 'wp', 'Get username fails')
        finally:
            db_session.close()




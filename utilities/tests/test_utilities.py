from test_base import BaseTestCase
import utilities.miscellaneous as misc
from db_mgt import json_tables as jt


class TestMiscellaneous(BaseTestCase):
    def test_get_file_name(self):
        foo = misc.get_temp_file_name('dumb', 'dumber')
        self.assertIsNotNone(foo)

    def test_json_add(self):
        db_session = None
        jsm = jt.JSONStorageManager(db_session)
        foo = dict()
        bar = dict()
        baz = dict()
        foo['a'] = bar
        bar['a'] = baz
        jsm.add_json('something', foo)



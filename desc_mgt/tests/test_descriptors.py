from test_base import BaseTestCase
import utilities.miscellaneous as misc
from utilities.toml_support import indent_toml, dict_to_toml, toml_to_dict, elaborate_toml_dict
from db_mgt import json_tables as jt
from db_mgt.db_exec import DBExec
import json


class TestDescriptors(BaseTestCase):
    def setUp(self):
        self.db_exec = DBExec()
        self.jsm = self.db_exec.create_json_manager()

    def tearDown(self):
        self.db_exec.terminate()

    def test_create_carousel(self):
        desc = self.jsm.get_json_from_name('P_CAROUSEL_SNIPPET')
        foo = 3
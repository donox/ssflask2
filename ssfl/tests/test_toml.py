from test_base import BaseTestCase, app
from io import StringIO
import csv
from db_mgt.json_tables import JSONStorageManager
from db_mgt.db_exec import DBExec
from ssfl.main import multi_story_page as msp
import toml, json


class TestTOML(BaseTestCase):
    def test_toml_dump_json(self):
        db_exec = DBExec()
        json_mgr = db_exec.create_json_manager()
        try:
            foo = json.loads(json_mgr.get_json_by_name('f2page').content)
            bar = toml.dumps(foo)
            with open('/home/don/devel/temp/foo.toml', 'w') as fl:
                fl.write(bar)
                fl.close()
        finally:
            db_exec.terminate()

    def test_make_json_descriptor(self):
        db_exec = DBExec()
        mgr = db_exec.create_json_manager()
        try:
            single_cell = mgr.make_json_descriptor(mgr.descriptor_front_page_fields)
            self.assertEqual(len(single_cell), 2, "Broken front page - 1")
            self.assertEqual(len(single_cell['PAGE']['rows'][0]['ROW']['columns']), 3, "Broken Front Page - 2")
        finally:
            db_exec.terminate()
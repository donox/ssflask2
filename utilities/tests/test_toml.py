from test_base import BaseTestCase
import utilities.miscellaneous as misc
from utilities.toml_support import indent_toml, dict_to_toml, toml_to_dict, elaborate_toml_dict
from db_mgt import json_tables as jt
from db_mgt.db_exec import DBExec
import toml
import json


class TestTOML(BaseTestCase):

    def test_print_toml(self):
        db_exec = DBExec()
        jsm = db_exec.create_json_manager()
        page = jsm.get_json_from_name('P_FRONTPAGE')
        toml_str = toml.dumps(page)
        out_str = indent_toml(toml_str)
        print(out_str)
        db_exec.terminate()

    def test_dict_to_toml(self):
        db_exec = DBExec()
        jsm = db_exec.create_json_manager()
        page = jsm.get_json_from_name('P_FRONTPAGE')
        out_dict = dict_to_toml(page)
        toml_str = toml.dumps(out_dict)
        out_str = indent_toml(toml_str)
        print(out_str)
        db_exec.terminate()


    def test_toml_to_dict(self):
        db_exec = DBExec()
        jsm = db_exec.create_json_manager()
        page = jsm.get_json_from_name('P_FRONTPAGE')
        out_dict = dict_to_toml(page)
        toml_str = toml.dumps(out_dict)
        out_str = indent_toml(toml_str)
        toml_dict = toml.loads(out_str)
        out_dict = toml_to_dict(toml_dict)
        toml_str = toml.dumps(out_dict)
        out_str = indent_toml(toml_str)
        print(out_str)
        db_exec.terminate()

    def test_toml_elaboration(self):
        db_exec = DBExec()
        jsm = db_exec.create_json_manager()
        page = jsm.get_json_from_name('fp_test')
        new_page = elaborate_toml_dict(db_exec, page)
        out_dict = dict_to_toml(page)
        toml_str = toml.dumps(out_dict)
        out_str = indent_toml(toml_str)
        toml_dict = toml.loads(out_str)
        out_dict = toml_to_dict(toml_dict)
        toml_str = toml.dumps(out_dict)
        out_str = indent_toml(toml_str)
        # with open('/home/don/devel/temp/foo.txt', 'w') as fl:
        #     fl.write(out_str)
        #     fl.close()
        print(out_str)
        db_exec.terminate()

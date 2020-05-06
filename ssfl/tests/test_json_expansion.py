from test_base import BaseTestCase, app
from db_mgt.db_exec import DBExec
from utilities.toml_support import dict_to_toml_file, elaborate_toml_dict, toml_to_dict
import toml
from db_mgt.json_tables import JSONTableManager

instr = '''[PAGE]
[[PAGE.rows]]

[PAGE.rows.ROW]
[[PAGE.rows.ROW.columns]]

[[PAGE.rows.ROW.columns.cells]]
element_type = "_xxx_"
element = "_xxx_"

[[PAGE.rows.ROW.columns]]

[[PAGE.rows.ROW.columns.cells]]
element_type = "_xxx_"
element = "_xxx_"

[PAGE.rows.ROW]
[[PAGE.rows.ROW.columns]]

[[PAGE.rows.ROW.columns.cells]]
element_type = "_xxx_"
element = "_xxx_"

[[PAGE.rows.ROW.columns]]

[[PAGE.rows.ROW.columns.cells]]
element_type = "_xxx_"
element = "_xxx_"

[PAGE.rows.ROW]
[[PAGE.rows.ROW.columns]]

[[PAGE.rows.ROW.columns.cells]]
element_type = "_xxx_"
element = "_xxx_"
                    
  
'''


class TestJSONExpansion(BaseTestCase):
    def build_toml(self):
        toml_json = dict()
        toml_json['PAGE'] = page = dict()
        page['ROWS'] = rows = list()
        for i in range(3):
            row = dict()
            row['COLUMNS'] = columns = list()
            for j in range(3):
                column = dict()
                column['CELLS'] = cells = list()
                for k in range(1):
                    cell = dict()
                    cells.append(cell)
                columns.append(column)
            rows.append(row)
        return toml_json

    def add_cell_value(self, top_dict, row, col, cell, key, val):
        top_dict['PAGE']['ROWS'][row]['COLUMNS'][col]['CELLS'][cell][key] = val

    def add_column_value(self, top_dict, row, col, key, val):
        top_dict['PAGE']['ROWS'][row]['COLUMNS'][col][key] = val

    def add_row_value(self, top_dict, row, key, val):
        top_dict['PAGE']['ROWS'][row][key] = val

    def add_page_value(self, top_dict, key, val):
        top_dict['PAGE'][key] = val

    def setUp(self):
        db_exec = DBExec()
        json_mgr = db_exec.create_json_manager()
        try:
            self.node_cnt = 0
            self.parent_dict = self.build_toml()
            self.parent_dict['descriptor'] = 'FRONTPAGE'        # Corresponds to a descriptor in json_tables
            self.parent_dict['name'] = 'parent'
            self.parent_dict['PAGE']['node_name'] = 'PAGE'

            self.child_dict = self.build_toml()
            self.child_dict['parent'] = 'FRONTPAGE'             # Name of the parent descriptor in Database
            self.child_dict['name'] = 'child'
            self.child_dict['PAGE']['node_name'] = 'PAGE'
            for i in range(3):
                self.add_row_value(self.parent_dict, i, 'descriptor', 'ROW')
                self.add_row_value(self.parent_dict, i, 'node_name', 'ROW-' + str(i))
                self.add_row_value(self.child_dict  , i, 'node_name', 'ROW-' + str(i))
                for j in range(3):
                    self.add_column_value(self.parent_dict, i, j, 'descriptor', 'COLUMN')
                    self.add_column_value(self.parent_dict, i, j, 'node_name', 'COLUMN-' + str((i, j)))
                    self.add_column_value(self.child_dict, i, j, 'node_name', 'COLUMN-' + str((i, j)))
                    for k in range(1):
                        self.add_cell_value(self.parent_dict, i, j, k, 'descriptor', 'CELL')
                        self.add_cell_value(self.parent_dict, i, j, k, 'node_name', 'CELL-' + str((i, j, k)))
                        self.add_cell_value(self.parent_dict, i, j, k, 'element_type', '_xxx_')
                        self.add_cell_value(self.parent_dict, i, j, k, 'element', '_xxx_')
                        self.add_cell_value(self.parent_dict, i, j, k, 'is-snippet', True)
                        self.add_cell_value(self.parent_dict, i, j, k, 'width', '_xxx_')
                        self.add_cell_value(self.parent_dict, i, j, k, 'height', '_xxx_')
                        self.add_cell_value(self.parent_dict, i, j, k, 'styles', '_xxx_')
                        self.add_cell_value(self.parent_dict, i, j, k, 'classes', '_xxx_')
                        self.add_cell_value(self.child_dict, i, j, k, 'node_name', 'CELL-' + str((i, j, k)))
                        self.add_cell_value(self.child_dict, i, j, k, 'element_type', 'STORY')
                        self.add_cell_value(self.child_dict, i, j, k, 'element', 'testing_story')
                        self.node_cnt += 1
            self.parent = toml.dumps(self.parent_dict)
            self.child = toml.dumps(self.child_dict)

        except Exception as e:
            raise e
        finally:
            db_exec.terminate()

    def test_merge_templates(self):
        db_exec = DBExec()
        json_mgr = db_exec.create_json_manager()
        try:
            child_dict = toml_to_dict(toml.loads(self.child))
            dict_to_toml_file(child_dict, '/home/don/Downloads/foo_child.toml')
            parent_dict = toml_to_dict(toml.loads(self.parent))
            dict_to_toml_file(parent_dict, '/home/don/Downloads/foo_parent.toml')
            res = json_mgr.merge_json_descriptors(child_dict, parent_dict)
            dict_to_toml_file(res, '/home/don/Downloads/foo.toml')
        except Exception as e:
            raise e

        finally:
            db_exec.terminate()

    def test_tree_walk(self):
        count = 0
        for leaf in JSONTableManager.walk_structure(self.parent_dict):
            count += 1
        self.assertEqual(9, count, "Did not get right number of leaves.")

    def test_find_branches(self):
        pass

    def test_elaborate_toml_dict(self):
        db_exec = DBExec()
        json_mgr = db_exec.create_json_manager()
        try:
            with open('/home/don/Documents/toml pages/full_frontpage.toml', 'r') as fl:
                toml_in = toml.loads(instr, dict)
                with open('/home/don/Downloads/foo_dump.toml', 'w') as fl2:
                    toml.dump(toml_in, fl2)
                    fl2.close()
                dict_to_toml_file(toml_in, '/home/don/Downloads/foo_in.toml')
                test_dict = toml_to_dict(toml_in)
                res = elaborate_toml_dict(db_exec, test_dict)
                dict_to_toml_file(res, '/home/don/Downloads/foo.toml')
                foo = 3
        except Exception as e:
            raise e

        finally:
            db_exec.terminate()



from test_base import BaseTestCase, app
import toml
from db_mgt.db_exec import DBExec
from collections import OrderedDict
from typing import List, Any, NoReturn
import copy
from utilities.template_support import merge_json_descriptors, walk_structure, find_branches, \
    build_descriptors_from_prototypes

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


class TestTemplateHandling(BaseTestCase):
    def build_tree(self, ii, jj, kk):
        tree = dict()
        tree['PAGE'] = page = dict()
        page['ROWS'] = rows = list()
        for i in range(ii):
            row = dict()
            if jj:
                row['COLUMNS'] = columns = list()
                for j in range(jj):
                    column = dict()
                    if kk:
                        column['CELLS'] = cells = list()
                        for k in range(kk):
                            cells.append(dict())
                    columns.append(column)
            rows.append(row)
        return tree

    def add_cell_value(self, top_dict, row, col, cell, key, val):
        top_dict['PAGE']['ROWS'][row]['COLUMNS'][col]['CELLS'][cell][key] = val

    def add_column_value(self, top_dict, row, col, key, val):
        top_dict['PAGE']['ROWS'][row]['COLUMNS'][col][key] = val

    def add_row_value(self, top_dict, row, key, val):
        top_dict['PAGE']['ROWS'][row][key] = val

    def add_page_value(self, top_dict, key, val):
        top_dict['PAGE'][key] = val

    def setUp(self):
        from db_mgt.json_tables import JSONStorageManager
        try:
            ii = 3
            jj = 3
            kk = 3
            self.node_cnt = 0
            self.parent_dict = self.build_tree(ii, jj, kk)
            self.parent_dict['descriptor'] = 'FRONTPAGE'  # Corresponds to a descriptor in json_tables
            self.parent_dict['name'] = 'parent'
            self.parent_dict['PAGE']['node_name'] = 'PAGE'

            self.child_dict = self.build_tree(ii, jj, kk)
            self.child_dict['parent'] = 'FRONTPAGE'  # Name of the parent descriptor in Database
            self.child_dict['name'] = 'child'
            self.child_dict['PAGE']['node_name'] = 'PAGE'

            for i in range(ii):
                self.add_row_value(self.parent_dict, i, 'descriptor', 'ROW')
                self.add_row_value(self.parent_dict, i, 'node_name', 'ROW-' + str(i))
                self.add_row_value(self.child_dict, i, 'node_name', 'ROW-' + str(i))
                for j in range(jj):
                    self.add_column_value(self.parent_dict, i, j, 'descriptor', 'COLUMN')
                    self.add_column_value(self.parent_dict, i, j, 'node_name', 'COLUMN-' + str((i, j)))
                    self.add_column_value(self.child_dict, i, j, 'node_name', 'COLUMN-' + str((i, j)))
                    for k in range(kk):
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

    def test_tree_walk(self):
        count = 0
        for leaf in walk_structure(self.parent_dict):
            count += 1
        self.assertEqual(27, count, "Did not get right number of leaves.")

    def test_find_branches(self):
        res = find_branches(self.parent_dict)
        self.assertEqual(27, len(res.keys()), "Incorrect number of branches returned")

    def test_merge_templates(self):
        merge_json_descriptors(self.child_dict, self.parent_dict)
        one_val = self.parent_dict['PAGE']['ROWS'][0]['COLUMNS'][0]['CELLS'][0]['element']
        self.assertEqual(one_val, 'testing_story', "Did not get proper result")

    def test_build_descriptors_from_prototypes(self):
        db_exec = DBExec()
        json_mgr = db_exec.create_json_manager()
        res = build_descriptors_from_prototypes(self.child_dict, json_mgr)
        with open('/home/don/Downloads/foo_build.toml', 'w') as fl2:
            toml.dump(res, fl2)
            fl2.close()
        try:
            res_val = res['PAGE']['rows'][0]['columns'][0]['cells'][0]['node_name']
            self.assertEqual('CELL-(0, 0, 0)', res_val, 'Incorrect cell returned from build')
        except Exception as e:
            self.assertEqual(1,0, f'Got Exception in checking build result: {e.args}')

from test_base import BaseTestCase, app
from io import StringIO
import csv
from db_mgt.json_tables import JSONStorageManager
from db_mgt.setup import create_session, get_engine
from ssfl.main import multi_story_page as msp


class TestJSONStorageManager(BaseTestCase):
    def test_update_db_with_descriptor(self):
        db_session = create_session(get_engine())
        try:
            mgr = JSONStorageManager(db_session)
            mgr.update_db_with_descriptor_prototype()
        finally:
            db_session.close()

    def test_make_json_descriptor(self):
        db_session = create_session(get_engine())
        try:
            mgr = JSONStorageManager(db_session)
            single_cell = mgr.make_json_descriptor(mgr.descriptor_single_cell_table_fields)
            self.assertEqual(len(single_cell), 2, "Incorrect single_cell descriptor")
            res = mgr.make_json_descriptor(mgr.descriptor_front_page_fields)
            self.assertEqual(len(res), 3, "Incorrect number of items in expansion of descriptor")
            self.assertEqual(len(res['rows']), 4, "Incorrect number of items in expansion of descriptor")
            res = mgr.make_json_descriptor(mgr.descriptor_event_snippet_fields)
            self.assertEqual(res, {'EVENT_SNIPPET': None, 'name': None, 'date': None, 'time': None, 'venue': None},
                             "Failure matching event_snippet json")
        finally:
            db_session.close()

    def test_make_single_cell_page(self):
        db_session = create_session(get_engine())
        try:
            mgr = JSONStorageManager(db_session)
            res = mgr.make_json_descriptor(mgr.descriptor_single_cell_table_fields)
            self.assertEqual(res, ['EVENT_SNIPPET', 'name', 'date', 'time', 'venue'],
                             "Failure matching event_snippet json")
            self.assertEqual(len(res), 3, "Incorrect number of items in expansion of descriptor")
            self.assertEqual(len(res[2]['rows']), 4, "Incorrect number of items in expansion of descriptor")
        finally:
            db_session.close()

    def test_make_single_story_page(self):
        db_session = create_session(get_engine())
        try:
            mgr = JSONStorageManager(db_session)
            res = mgr.make_json_descriptor(mgr.get_json_from_name('P_SINGLECELLROW'))
            res['rows'][0]['columns'][0]['cells'][0]['element'] = "S_STORY"
            res['rows'][0]['columns'][0]['cells'][0]['element_type'] = "STORY"
            new_res = mgr.make_json_descriptor(res)
            new_res['rows'][0]['columns'][0]['cells'][0]['STORY']['name'] = 'Gravity-always-wins'
            mgr.add_json('test_story', new_res)
            new_page = msp.MultiStoryPage(db_session)
            new_page.load_descriptor_from_database('test_story')
            new_res = new_page.make_multi_element_page_context()
            self.assertEqual(len(new_res['rows'][0]['columns'][0]['cells'][0]['STORY']['content']), 5780,
                             "Story Expansion was wrong length")
        finally:
            db_session.close()

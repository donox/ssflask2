from test_base import BaseTestCase
from io import StringIO
import csv
from db_mgt.json_tables import JSONStorageManager


class TestJSONStorageManager(BaseTestCase):
    def test_make_json_descriptor(self):
        mgr = JSONStorageManager(None)
        descriptor_event_snippet_fields = ["EVENT_SNIPPET", "name", "date", "time", "venue"]
        descriptor_front_page_fields = ["FRONTPAGE", "name",
                                        {"rows": [["ROW", {"columns": [
                                            ["COLUMN", {"cells": []}],
                                            ["COLUMN", {"cells": []}],
                                            ["COLUMN", {"cells": []}]
                                        ]}, "column_width"],
                                                  ["ROW", {"columns": [], "column_width": 3}],
                                                  ["ROW", {"columns": []}, "column_width"]
                                                  ]}]
        res = mgr.make_json_descriptor("EVENT_SNIPPET", descriptor_event_snippet_fields)
        self.assertEqual(res,
                         {'type': 'EVENT_SNIPPET', 'EVENT_SNIPPET': None, 'name': None,
                          'date': None, 'time': None, 'venue': None},
                         "Failure matching event_snippet json")
        res = mgr.make_json_descriptor("FRONTPAGE", descriptor_front_page_fields)
        self.assertEqual(len(res.items()), 4, "Incorrect number of items in expansion of descriptor")

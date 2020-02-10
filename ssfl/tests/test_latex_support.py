from test_base import BaseTestCase
from io import StringIO
import csv
from process_word_sources.process_word_source import WordSourceDocument


class TestDBManageCalendarForm(BaseTestCase):
    def test_tree_walk(self):
        doc_name = 'LatexExample'
        target_directory = '/home/don/devel/nightly-scripts/outdoc/'
        doc_to_convert = target_directory + doc_name
        doc_output = target_directory + 'outdoc/'
        self.wsd = WordSourceDocument(target_directory, doc_name, doc_output, None)

        for item in self.wsd.get_html_tree_walk(self.wsd.html_etree):
            print(item)

#     def test_validate_on_submit(self):
#         foo = 3
#         self.assertTrue(True)
#
#
# class TestCalendarImport(BaseTestCase):
#     def test_sanitize_csv(self):
#         pass
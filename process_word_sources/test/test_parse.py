import unittest
import re

from io import StringIO
import csv
from process_word_sources.process_word_source import WordSourceDocument


class TestParse(unittest.TestCase):

    def _body_of_test(self, test_string):
        source_file = 'dummy'
        logger = None
        try:
            wsd = WordSourceDocument(source_file, logger)
            result = wsd._parse_whole_text(test_string)
            return result
        except Exception as e:
            wsd.print_trace()
            self.assertTrue(False, 'Exception occurred running test')

    def test_parse_simple_latex(self):
        test_string = r'  fgsfgd  \bold{Fribblenauer} <hr/>'
        test_string = test_string.replace('\\', '\a')
        result = self._body_of_test(test_string)
        self.assertEqual(len(result), 71, 'Result list is wrong length')
        test_string = r'  fgsfgd  \bold{Fribblenauer} <hrx> fgsfgd  \italics{jonesday} </hrx>'
        test_string = test_string.replace('\\', '\a')
        result = self._body_of_test(test_string)
        self.assertEqual(len(result), 130, 'Result list is wrong length')

    def test_regex_parse(self):
        source_file = 'dummy'
        logger = None
        test_string = r'  fgsfgd  \bold{Fri <foo> Hello World </foo> auer}'
        test_string = test_string.replace('\\', '\a')
        wsd = WordSourceDocument(source_file, logger)
        result = wsd._create_delimited_strings(test_string)
        self.assertEqual(len(result), 8, 'Result list is wrong length')
        self.assertEqual(result[2][1], 'Fri ', 'Incorrect result in list')

    def test_parse_simple_html(self):
        test_string = r'asdf df <foo> <bar>    baz</bar><cad id="3"> Some Stuff</cad></foo>'
        result = self._body_of_test(test_string)
        self.assertEqual(len(result), 119, 'Result list is wrong length')

    def test_parse_nested_latex(self):
        test_string = r'\italics{\bold {\title{SOME}Fribblenauer\byline{Ludddd} Hello} stuff\em{Mozart}}bread'
        test_string = test_string.replace('\\', '\a')
        try:
            result = self._body_of_test(test_string)
            self.assertEqual(len(result), 175, 'Result list is wrong length')
        except Exception as e:
            self.assertTrue(False, 'Exception occurred running test')



from test_base import BaseTestCase
from db_mgt.db_exec import DBExec
from process_word_sources.process_word_source import WordSourceDocument


class TestParse(BaseTestCase):

    def _body_of_test(self, test_string):
        db_exec = DBExec()
        logger = None
        try:
            wsd = WordSourceDocument(db_exec, logger)
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
            self.assertEqual(len(result), 73, 'Result list is wrong length')
        except Exception as e:
            self.assertTrue(False, 'Exception occurred running test')

    def test_create_doctype(self):
        html = """<p>\\figure{TestFig}</p><p>\photoset{16817, 16231, 16647}</p>
        <p>\photo{16742}{Woodshopw making cradles}</p><p>\phototitle{Try this for a slideshow}</p>
        <p>\photoposition{right}</p><p>\photosize{width=300}{height=300}</p><p>\photorotation{4}</p>
        <p>\endfigure{TestFig}</p><p>\placefigure{TestFig}</p><h1>\\title{Hickory Cove Chronicles} </h1>
        <h2>\\byline{LUDDD CREEF}</h2><h2>8-11-18</h2><p>\subtitle{I GUESS I SHOWED HER…}</p>"""
        html_only = '<html>' + html + '</html>'
        db_exec = DBExec()
        logger = None
        try:
            wsd = WordSourceDocument(db_exec, logger)
            wsd.read_docs_from_string(html_only)
            html = wsd.build_html_output_tree()
            self.assertEqual(2609, len(html), "Didn't get right result")
        except Exception as e:
            foo = 3




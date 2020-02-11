from lxml import etree
from utilities.run_log_command import run_shell_command
from utilities.miscellaneous import get_temp_file_name
import re


class WordSourceDocument(object):
    """Convert marked up Document in MS Word format to HTML.

    """
    def __init__(self, source_file,  logger):
        self.logger = logger
        self.docx_source = source_file + '.docx'
        self.html_etree = None
        self.node_count = 0             # unique ID for nodes in tree walk
        self.pending_close_cmd = []    # stack of outstanding latex commands that are not closed via '}'
                                        #    does not address environment close (???)
        self.no_span_needed = ['p', 'h1', 'h2', 'h3', 'h4', 'span', 'em', 'strong']

        self.process_element = dict()
        self.process_element['html'] = self._element_html
        self.process_element['p'] = self._element_p
        self.process_element['span'] = self._element_span
        self.process_element['em'] = self._element_em
        self.process_element['strong'] = self._element_strong
        self.process_element['h1'] = self._element_h1
        self.process_element['h2'] = self._element_h2
        self.process_element['h3'] = self._element_h3
        self.process_element['h4'] = self._element_h4
        self.process_element['sup'] = self._element_sup
        self.process_element['img'] = self._element_img
        self.process_element['a'] = self._element_a
        self.process_element['X'] = self._element_x

        self.process_latex = dict()
        self.process_latex['title'] = self._latex_title
        self.process_latex['byline'] = self._latex_byline
        self.process_latex['subtitle'] = self._latex_subtitle
        self.process_latex['textbf'] = self._latex_textbf
        self.process_latex['textif'] = self._latex_textif
        self.process_latex['underline'] = self._latex_underline
        self.process_latex['X'] = self._latex_x
        self.process_latex['X'] = self._latex_x




    def read_docs_as_html(self):
        # Translate DOCX to HTML
        html_source = get_temp_file_name('html', 'html')
        try:
            cmd_run_mammoth = f'mammoth {self.docx_source} {html_source}'
            run_shell_command(cmd_run_mammoth, self.logger)
            with open(html_source, 'r') as fl:
                html_only_list = fl.readlines()
            html_only = '<html>'
            for line in html_only_list:
                html_only += line
            html_only += '</html>'
            self.html_etree = etree.fromstring(html_only)
        except Exception as e:
            self.logger.make_error_entry(f'Fail to create HTML from {self.docx_source}')
            raise e

    def get_html_tree_walk_iterator(self, node, res_list):
        '''Return nodes from tree in document order, converting to either list of children or text only nodes.

        Processing:
            (1) Any node containing both text and children is converted to a node list in which the text elements
                are surrounded with 'scan' tags.
            (2) Any node containing a latex command is converted to a 'command' node.  It is ASSUMED that any
                latex command is contained in a single text string of its containing node.
            (3) Any closing brace not in a latex command is ASSUMED to be the close of a latex command initiated
                earlier.
        '''
        if etree.iselement(node):
            children = list(node)
            if not res_list:
                res_list = []
                res_index = 0
            else:
                res_index = len(res_list)
            res_list.append(self._make_tree_walk_dict('start', node.tag))
            if node.text:
                self._convert_text_node(res_list, node.text)
            for child in children:
                res_list.append(self._make_tree_walk_dict('child', child))
            res_list.append(self._make_tree_walk_dict('end', node.tag))
            if node.tail:
                self._convert_text_node(res_list, node.tail)

            for item in res_list[res_index:]:
                if item['type'] != 'child':
                    yield item
                else:
                    for next_item in self.get_html_tree_walk_iterator(item['content'], res_list):
                        yield next_item

    def get_html_etree_iterator(self):
        for el in self.html_etree.iter():
            yield el

    def _make_tree_walk_dict(self, node_type, node_content):
        res = dict()
        res['id'] = self.node_count
        self.node_count += 1
        res['type'] = node_type
        res['content'] = node_content
        return res

    def _enclose_in_span(self, res_list, node_text):
        if len(res_list) > 1:
            last_cmd = res_list[-1]['content']
            last_type = res_list[-1]['type']
            if last_type == 'start' and last_cmd in self.no_span_needed:
                res_list.append(self._make_tree_walk_dict('text', node_text))
                return
        res_list.append(self._make_tree_walk_dict('start', 'span'))
        res_list.append(self._make_tree_walk_dict('text', node_text))
        res_list.append(self._make_tree_walk_dict('end', 'span'))

    def _process_command_first_in_string(self, res_list, node_text, m_start, m_end):
        if m_start > 0:
            self._enclose_in_span(res_list, node_text[:m_start])
        cmd = node_text[m_start + 1:m_end - 1]
        res_list.append(self._make_tree_walk_dict('cmdstart', cmd))
        self.pending_close_cmd.append(cmd)
        self._convert_text_node(res_list, node_text[m_end:])
        return

    def _convert_text_node(self, res_list, node_text):
        try:
            re_env = re.compile(r"\\(begin|end){([^}]*)}")   # Special processing command
            re_st = re.compile(r"\\([a-z]+){")      # Simple command with no arguments
            re_st_1 = re.compile(r"\\([a-z]+){([^}]*)} *{")     # Command with one argument - all in same text
            if len(node_text) == 0:
                return
            cur_start = 0
            m_cmd_arg = None
            text_len = len(node_text)
            re_env_match = re_env.search(node_text)
            if re_env_match:
                m_cmd = re_env_match.group(1)
                m_cmd_arg = re_env_match.group(2)
                if m_cmd == 'begin':      # Begin environment
                    self.pending_close_cmd.append(m_cmd_arg)
                    res_list.append(self._make_tree_walk_dict('envstart', m_cmd_arg))
                elif m_cmd == 'end':      # End environment
                    if not self.pending_close_cmd:
                        raise ValueError('Encountered latex expression close when none is open')
                    if not self.pending_close_cmd[-1] == m_cmd_arg:
                        raise ValueError(f'Expected env close, found {self.pending_close_cmd[-1]} instead {m_cmd_arg} ')
                    self.pending_close_cmd.pop()
                    res_list.append(self._make_tree_walk_dict('envclose', m_cmd_arg))
                self._convert_text_node(res_list, node_text[re_env_match.end():])
                return
            else:
                # process regular command
                re_first_match = re_st.search(node_text)
                first_close = node_text.find('}')
                re_first_match_arg = re_st_1.search(node_text)
                # First real command is earliest of the two matches.  If re_first_match_arg hits then so will
                # re_first_match
                if re_first_match_arg and (re_first_match_arg.start() == re_first_match.start()):
                    m_end = re_first_match_arg.end()
                    first_close = node_text[m_end:].find('}')
                    if first_close > -1:        # if there is real first_close, must determine actual position
                        first_close += m_end
                    m_cmd_arg = re_first_match_arg.group(2)
                    self._make_tree_walk_dict('cmdarg', m_cmd_arg)
                    re_first_match = re_first_match_arg     # with arg recorded, can pretend that re's are the same
                if not re_first_match and (first_close == -1):
                    self._enclose_in_span(res_list, node_text)
                    return
                if re_first_match:          # have a match but need to check for closing bracket after the match (don't
                                            #    hit arg close)
                    m_start = re_first_match.start()
                    m_end = re_first_match.end()
                    if first_close > -1:
                        if first_close < m_start:
                            # close a prior expression and process remainder of string
                            if not self.pending_close_cmd:
                                raise ValueError('Encountered latex expression close when none is open')
                            else:
                                if first_close > 0:   # There is text before the close
                                    self._enclose_in_span(res_list, node_text[0:first_close])
                                cmd = self.pending_close_cmd.pop()
                                res_list.append(self._make_tree_walk_dict('cmdend', cmd))
                                self._convert_text_node(res_list, node_text[first_close+1:])
                                return
                        else:      # BEWARE - DON'T PICK UP ARG CLOSE - should not be a problem if matcher captures args
                            # new command comes first - enclose any preceding text, push command and process
                            self._process_command_first_in_string(res_list, node_text, m_start, m_end)
                            return
                    else:
                        # There are no closing braces - process command initiation
                        self._process_command_first_in_string(res_list, node_text, m_start, m_end)
                        return
                else:   # No match, but found close - enclosed initial in span, add close, process rest of string
                    self._enclose_in_span(res_list, node_text[0:first_close])
                    cmd = self.pending_close_cmd.pop()
                    res_list.append(self._make_tree_walk_dict('cmdend', cmd))
                    self._convert_text_node(res_list, node_text[first_close + 1:])
                    return
        except Exception as e:
            foo = 3
            raise e

    def build_html_output_tree(self):
        '''Construct html incorporating expanded latex suitable for use in Jinja Templates.

        The document is constructed as an HTML body.  Elements or parts of elements are created
        as text items in a list which is joined with single spaces between items.'''
        try:
            page_body = []
            pe_keys = self.process_element.keys()
            for item in self.get_html_tree_walk_iterator(self.html_etree, None):
                if item['type'] == 'start':             # 'start', 'end' handle ordinary html elements
                    elem_kind = item['content']
                    if elem_kind not in pe_keys:
                        raise ValueError(f'No processor for element {elem_kind}')
                    page_body.append(self.process_element[elem_kind](item))
                elif item['type'] == 'text':
                    page_body.append(item['content'])
                elif item['type'] == 'end':
                    page_body.append('</' + item['content'] + '>')
                elif item['type'] == 'cmdstart':                        # 'cmdstart', 'cmdend' handle latex elements
                    ltx_cmd = item['content']
                    page_body.append(self.process_latex[ltx_cmd](item, 'start'))
                elif item['type'] == 'cmdend':
                    page_body.append(self.process_latex[ltx_cmd](item, 'end'))
                elif item['type'] == 'envstart':                        # 'envstart', 'envclose' handle latex environments
                    page_body.append('<h1>LATEX CMD: ' + item['content'] + '</h1>')
                elif item['type'] == 'envclose':
                    page_body.append('<h1>LATEX CMD: ' + item['content'] + '</h1>')
                else:
                    raise ValueError(f"Item type: {item['type']} not recognized.")
            return ' '.join(page_body)
        except Exception as e:
            foo = 3
            raise e

    def _element_html(self, item):
        """Body is our top level element.  The document is assumed to contain no header information."""
        return '<body>'

    def _element_p(self, item):
        return '<p>'

    def _element_span(self, item):
        return '<span>'

    def _element_em(self, item):
        return '<em>'

    def _element_strong(self, item):
        return '<strong>'

    def _element_h1(self, item):
        return '<h1>'

    def _element_h2(self, item):
        return '<h2>'

    def _element_h3(self, item):
        return '<h3>'

    def _element_h4(self, item):
        return '<h4>'

    def _element_sup(self, item):
        return '<sup>'

    def _element_img(self, item):
        return '<h4>IMG NEEDED</h4>'

    def _element_x(self, item):
        return '<x>'

    def _element_x(self, item):
        return '<x>'

    def _element_x(self, item):
        return '<x>'

    def _element_x(self, item):
        return '<x>'

    def _element_a(self, item):
        return f'<h2>Element "a" found: {item}</h2>'

    def _latex_title(self, item, start_end):
        if start_end == 'start':
            return '<div class="display-2">'
        else:
            return '</div>'

    def _latex_byline(self, item, start_end):
        if start_end == 'start':
            return '<strong>by '
        else:
            return '</strong>'

    def _latex_subtitle(self, item, start_end):
        if start_end == 'start':
            return '<div class="display-3">'
        else:
            return '</div>'

    def _latex_textbf(self, item, start_end):
        if start_end == 'start':
            return '<strong>'
        else:
            return '</strong>'

    def _latex_textif(self, item, start_end):
        if start_end == 'start':
            return '<em>'
        else:
            return '</em>'

    def _latex_underline(self, item, start_end):
        if start_end == 'start':
            return '<u>'
        else:
            return '</u>'

    def _latex_x(self, item, start_end):
        if start_end == 'start':
            return '<h2>Surround X</h2>'
        else:
            return '<h2>End X</h2>'



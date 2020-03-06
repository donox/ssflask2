from lxml import etree
from xml.etree import ElementTree
from utilities.sst_exceptions import WordHTMLExpressionError, WordLatexExpressionError, WordInputError, \
    WordRenderingError, WordContentFeatureExists
from .photos import Photo
from config import Config
from db_mgt.photo_tables import SlideShow as sls

import re
import mammoth


def get_temp_file_name(a, b):
    return '/home/don/devel/temp/proto.html'


class ParsedElement(object):
    """ Base class to represent elements of the parse and support expansion.

    """

    def __init__(self, element_type, source, parent):
        self.element_type = element_type
        self.source = source
        self.parent = parent
        self.top = None
        self.parsed_result = []  # List of 2-tuples and objects.  Tuple is ('node_type', content)
        if self.parent:
            self.top = self.parent.get_top()

    def get_top(self):
        if self.parent:
            return self.top
        else:
            return self

    def get_parent(self):
        return self.parent

    def get_parent_type(self):
        if self.parent:
            return self.parent.element_type
        else:
            return 'Top'

    def process_opening_node(self):  # default - overridden if something different required
        self.parsed_result.append(('Open', self.source_item))

    def parse(self):
        """Parse input source associated with this element.

        (1) Self.source does not include open node (if exists).  Parse runs through close node (if exists).
            Each object provides (if needed) a function to perform any actions associated with the encounter
            of the opening node since the actual call to parse will be past that node(avoid infinite recursion).
        (2) It is initiated immediately after creation and calls subordinate nodes to parse themselves
            as it creates them.  That call returns the number of nodes consumed.
        (3) max_ndx exists to prevent indexing errors on ill-formed (no close) input.
        (4) Output is self.parsed_result as a list of nodes is directly a part of this node and objects
            representing each node subordinate to it.

        :return: None.  self.parsed_result properly formed.
        """
        if not self.source:
            return 0
        ndx = 0
        max_ndx = len(self.source)
        this_el_type = ''
        try:
            while True:
                if ndx >= max_ndx:
                    return ndx
                el, item = self.source[ndx]
                if el == 'Free':
                    free_el = FreeElement(item, self.source[ndx + 1:], self)
                    free_el.process_opening_node()
                    self.parsed_result.append(free_el)
                    ndx += 1
                # Process HTML Elements
                elif el == 'HOpen':
                    html_el = HTMLElement(item, self.source[ndx + 1:], self)
                    html_el.process_opening_node()
                    self.parsed_result.append(html_el)
                    cnt_nodes_parsed = html_el.parse()
                    ndx += cnt_nodes_parsed + 1
                elif el == 'HSelf':
                    html_el = HTMLElement(item, self.source[ndx + 1:], self)
                    html_el.process_opening_node()
                    self.parsed_result.append(html_el)
                    cnt_nodes_parsed = html_el.parse()
                    ndx += cnt_nodes_parsed + 1
                elif el == 'HClose':
                    self.parsed_result.append(('Close', item))
                    return ndx + 1
                # Process Latex Elements
                elif el == 'LOpen':
                    latex_el = LatexElement(item, self.source[ndx + 1:], self)
                    latex_el.process_opening_node()
                    self.parsed_result.append(latex_el)
                    cnt_nodes_parsed = latex_el.parse()
                    ndx += cnt_nodes_parsed + 1
                elif el == 'LMult':
                    self.parsed_result.append(('NewArg', item))
                    ndx += 1
                elif el == 'LClose':
                    self.parsed_result.append(('Close', item))
                    return ndx + 1
                else:
                    raise WordInputError(f'Invalid  parse_tree input: {self.source[ndx]}')


        except Exception as e:
            foo = 3

    def render(self):
        res = ''
        for node in self.parsed_result:
            if type(node) == tuple:
                el, item = node
                if el == 'HSelf':
                    res += str(item)
                else:
                    res += '<UndrendredElement>' + str(node) + '</UndrendredElement>'
            else:
                res += str(node.render())
        if self.element_type == 'Top':
            return res
        else:
            return '<UndrendredElement>' + res + '</UndrendredElement>'


class TopElement(ParsedElement):
    def __init__(self, source_list, db_session):
        self.db_session = db_session
        self.environment = []  # Environments that control interpretation set/cleared by latex expressions
        self.photo_frames = dict()
        self.current_photo_frame = None
        self.content_features = dict()      # A dictionary of things found in the parse (e.g, title) useful to parents
        super().__init__('Top', source_list, None)
        pass

    def parse(self):
        super().parse()
        return self

    def open_environment(self, env_name):
        if env_name in self.environment:
            raise WordInputError(f'Environment: {env_name} already open.')
        else:
            self.environment.append(env_name)

    def close_environment(self, env_name):
        if self.environment and self.environment[-1] != env_name:
            raise WordInputError(f'Environment: {env_name} not most recently created environment.')

    def add_photo_frame(self, name):
        if name in self.photo_frames.keys():
            raise WordLatexExpressionError(f'Photo Frame {name} exists.')
        new_frame = sls.Slideshow(name, self.db_session)
        self.photo_frames[name] = new_frame
        self.current_photo_frame = new_frame
        return new_frame

    def clear_current_frame(self, arg):
        if self.current_photo_frame.name != arg:
            raise WordLatexExpressionError(f'Attempt to clear wrong photo frame: {arg}')
        self.current_photo_frame = None

    def get_photo_frame(self, name):
        if name in self.photo_frames.keys():
            return self.photo_frames[name]
        else:
            raise WordLatexExpressionError(f'Photo Frame {name} does not exist.')

    # Content features are intended to provide a mechanism for accumulating information
    # while processing a document that may be useful at a higher level such as placing the
    # title in the database.
    def get_content_features(self):
        return self.content_features

    def add_content_feature(self, name, value):
        if name in self.content_features.keys():
            raise WordContentFeatureExists(f'Feature: {name} has already been added')
        self.content_features[name] = value

    def add_content_feature_list(self, name, value):
        if name in self.content_features.keys():
            self.content_features[name].append(value)
        else:
            self.content_features[name] = [value]

class FreeElement(ParsedElement):
    def __init__(self, item, source_list, parent):
        super().__init__('Free', source_list, parent)
        self.source_item = item

    def render(self, renderer=None):
        parent_type = self.get_parent_type()
        if not renderer:
            if parent_type == 'HTML':
                return '<scan>' + self.source_item + '</scan>'
            elif parent_type == 'Latex':
                return self.source_item
            elif parent_type == 'Top':  # Free standing element not in expression => at start or end
                return '<scan>' + self.source_item + '</scan>'
            else:
                raise WordInputError(f'Invalid element type: {parent_type}')
        else:
            return renderer(self.source_item)


class LatexElement(ParsedElement):
    def __init__(self, item, source_list, parent):
        super().__init__('Latex', source_list, parent)
        self.source_item = item
        self.command = None
        self.args = [[]]  # We accumulate the elements and render at close based on verb (name of element)
        # args are added to self.args[-1] as encountered.  New args are added on 'LMult'
        self.command_processors = dict()
        self.command_processors['bold'] = self._latex_textbf
        self.command_processors['textbf'] = self._latex_textbf
        self.command_processors['italics'] = self._latex_textif
        self.command_processors['underline'] = self._latex_underline
        self.command_processors['textif'] = self._latex_textif
        self.command_processors['title'] = self._latex_title
        self.command_processors['subtitle'] = self._latex_subtitle
        self.command_processors['byline'] = self._latex_byline
        self.command_processors['begin'] = self._latex_begin_env
        self.command_processors['end'] = self._latex_end_env
        self.command_processors['figure'] = self._latex_begin_figure
        self.command_processors['endfigure'] = self._latex_end_figure
        self.command_processors['photoset'] = self._latex_photoset
        self.command_processors['photo'] = self._latex_photo
        self.command_processors['phototitle'] = self._latex_photo_title
        self.command_processors['photoposition'] = self._latex_photo_postion
        self.command_processors['photorotation'] = self._latex_photo_rotation
        self.command_processors['placefigure'] = self._latex_place_figure
        self.command_processors['photosize'] = self._latex_photo_size
        self.command_processors['bold'] = self._latex_photo

    def process_opening_node(self):
        self.parsed_result.append(('Open', self.source_item[1:-1]))  # Remove backslash and left brace

    def render(self):
        try:
            res = ''
            for el_structure in self.parsed_result:
                if type(el_structure) == tuple:
                    el, item = el_structure
                    if el == 'Open':
                        self.command = item.strip()
                    elif el == 'NewArg':
                        self.args.append(list())
                    elif el == 'Close':
                        res += self._render_from_args()
                    else:
                        raise WordLatexExpressionError(f'Invalid structure type in Latex node: {el}')
                else:
                    if len(self.args) > 0:
                        tmp = el_structure.render()
                        self.args[-1].append(tmp)
                    else:
                        raise ValueError(f'System error - invalid length in args structure in Latex Element render')
            return res
        except Exception as e:
            raise WordLatexExpressionError(f'Error in Latex Element render: {el_structure}')

    def _render_from_args(self):
        """All args processed, so now can render properly."""
        if self.command in self.command_processors:
            cmd = self.command_processors[self.command]
            tmp = cmd()
            return tmp
        else:
            el = 'LATEXElement_' + self.command + '>'
            return '<' + el + '>El:' + el + 'Has: ' + str(len(self.args)) + ' args</' + el

    def _latex_textbf(self):
        res = '<strong>'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex Bold called with wrong args: {self.args}')
        arg = self.args[0][0]
        res += str(arg)
        return res + '</strong>'

    def _latex_textif(self):
        res = '<em>'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex Italics called with wrong args: {self.args}')
        arg = self.args[0][0]
        res += str(arg)
        return res + '</em>'

    def _latex_underline(self):
        res = '<span style="text-decoration:underline">'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex Underline called with wrong args: {self.args}')
        arg = self.args[0][0]
        res += str(arg)
        return res + '</span>'

    def _latex_title(self):
        res = '<div class="title">'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex title called with wrong args: {self.args}')
        arg = self.args[0][0]
        super().get_top().add_content_feature('title',  arg)
        res += str(arg)
        return res + '</div>'

    def _latex_byline(self):
        res = '<div class="byline">'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex title called with wrong args: {self.args}')
        arg = self.args[0][0]
        super().get_top().add_content_feature('byline', arg)
        res += str(arg)
        return res + '</div>'

    def _latex_subtitle(self):
        res = '<div class="subtitle">'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex subtitle called with wrong args: {self.args}')
        arg = self.args[0][0]
        res += str(arg)
        return res + '</div>'

    def _latex_begin_env(self):
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex begin environment called with wrong args: {self.args}')
        arg = self.args[0][0]
        top_element = super().get_top()
        top_element.open_environment(arg)
        return ''

    def _latex_end_env(self):
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex end environment called with wrong args: {self.args}')
        arg = self.args[0][0]
        top_element = super().get_top()
        top_element.close_environment(arg)
        return ''

    def _latex_begin_figure(self):
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex figure called with wrong args: {self.args}')
        arg = self.args[0][0]
        top_element = super().get_top()
        top_element.add_photo_frame(arg)
        return ''

    def _latex_end_figure(self):
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex end figure called with wrong args: {self.args}')
        arg = self.args[0][0]
        top_element = super().get_top()
        top_element.clear_current_frame(arg)
        return ''

    def _latex_photoset(self):
        """Accept comma separated list of photo IDs and add to photo frame"""
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex end figure called with wrong args: {self.args}')
        photo_list_text = self.args[0][0]
        top_element = super().get_top()
        try:
            photo_list = photo_list_text.split(',')
            for photo_nbr in photo_list:
                photo_id = int(photo_nbr.strip())
                top_element.current_photo_frame.add_photo(photo_id)
        except Exception as e:
            pass
            raise e
        return ''

    def _latex_photo(self):
        photo = self.args[0][0]
        try:
            top_element = super().get_top()
            photo_id = int(photo.strip())
            top_element.current_photo_frame.add_photo(photo_id)
        except Exception as e:
            pass
            raise e
        return ''

    def _latex_photo_title(self):
        top_element = super().get_top()
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex end figure called with wrong args: {self.args}')
        arg = self.args[0][0]
        top_element.current_photo_frame.add_title(arg)
        return ''

    def _latex_photo_postion(self):
        top_element = super().get_top()
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex end figure called with wrong args: {self.args}')
        arg = self.args[0][0]
        if arg not in ['center', 'left', 'right']:
            raise WordLatexExpressionError(f'Photo Frame unrecognized position: {arg}')
        top_element.current_photo_frame.set_position(arg)
        return ''

    def _latex_photo_size(self):
        try:
            top_element = super().get_top()
            for arg in self.args[0]:
                els = arg.split('=')
                if els[0].startswith('w'):
                    dimension = 'width'
                else:
                    dimension = 'height'
                size = int(els[1].strip())
                top_element.current_photo_frame.set_dimension(dimension, size)
            return ''
        except Exception as e:
            raise e

    def _latex_photo_rotation(self):
        top_element = super().get_top()
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex end figure called with wrong args: {self.args}')
        arg = self.args[0][0]
        try:
            arg_float = float(arg)
        except Exception as e:
            raise WordLatexExpressionError(f'Latex invalid value for photo frame rotation speed: {arg}')
        top_element.current_photo_frame.set_rotation(arg_float)
        return ''

    def _latex_place_figure(self):
        top_element = super().get_top()
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex end figure called with wrong args: {self.args}')
        arg = self.args[0][0]
        frame = top_element.get_photo_frame(arg)
        return frame.get_html()

    def _latex_x(self, item, start_end):
        if start_end == 'start':
            return '<h2>Surround X</h2>'
        else:
            return '<h2>End X</h2>'


class HTMLElement(ParsedElement):
    def __init__(self, item, source_list, parent):
        super().__init__('HTML', source_list, parent)
        self.source_item = item

    def process_opening_node(self):
        res = self.source_item[1:-1]
        if res[-1] == '/':  # Self closing HTML - remove trailing slash
            res = res[:-1]
        self.parsed_result.append(('Open', self.source_item))

    def render(self):
        """This rendering is just copying the html from the source document to the output.

        This is an artifact of the HTML element not using a command structure (i.e., element
        tag) like a Latex element. Switching to a full command structure will allow the
        easy addition of new features (such as finding empty 'scan'  or 'p' elements, adding
        css classes, ..."""
        try:
            res = ''
            for el_structure in self.parsed_result:
                if type(el_structure) == tuple:
                    el, item = el_structure
                    if el == 'Open':
                        res += str(item)  # Should not need str - unless there is an error
                    elif el == 'HSelf':
                        res += item
                    elif el == 'Close':
                        res += item
                    else:
                        raise WordLatexExpressionError(f'Invalid structure type in Latex node: {el}')
                else:
                    tmp = el_structure.render()
                    res += tmp
            return res
        except Exception as e:
            raise WordRenderingError(f'Unspecified Error in Word Render')


class WordSourceDocument(object):
    """Convert marked up Document in MS Word format to HTML.

    """

    def __init__(self, db_session, source_file, logger):
        self.logger = logger
        self.db_session = db_session
        self.docx_source = source_file
        self.content_features = None
        self.text_as_substrings = []
        self.html_etree = None
        self.env_blocks = []  # Stack of outstanding environment blocks
        self.node_count = 0  # unique ID for nodes in tree walk
        #    does not address environment close (???)
        self.no_span_needed = ['p', 'h1', 'h2', 'h3', 'h4', 'span', 'em', 'strong']
        self.flat_list = []  # flattened result list after parsing

        self.trace_list = []

        # self.process_element = dict()
        # self.process_element['html'] = self._element_html
        # self.process_element['p'] = self._element_p
        # self.process_element['span'] = self._element_span
        # self.process_element['em'] = self._element_em
        # self.process_element['strong'] = self._element_strong
        # self.process_element['h1'] = self._element_h1
        # self.process_element['h2'] = self._element_h2
        # self.process_element['h3'] = self._element_h3
        # self.process_element['h4'] = self._element_h4
        # self.process_element['sup'] = self._element_sup
        # self.process_element['img'] = self._element_img
        # self.process_element['a'] = self._element_a
        # self.process_element['X'] = self._element_x

    def trace(self, **kwargs):
        self.trace_list.append(kwargs)

    def print_trace(self):
        for entry in self.trace_list:
            print(entry.__repr__())

    def read_docs_as_html(self):
        # Translate DOCX to HTML
        try:
            with open(self.docx_source, 'rb') as docx_file:
                result = mammoth.convert_to_html(docx_file)
                html = result.value
                html_only = '<html>' + html + '</html>'
                self.html_etree = etree.fromstring(html_only)
        except Exception as e:
            self.logger.make_error_entry(f'Fail to create HTML from {self.docx_source}')
            raise e

    def _find_last_element_in_nested_list(self, res):
        if type(res) == list:
            return self._find_last_element_in_nested_list(res[-1])
        else:
            return res

    def get_content_features(self):
        return self.content_features

    def _create_delimited_strings(self, txt):
        """Convert html/latex source to strings delimited by open/close latex/html and text.

        :param txt: str
        :return: List(2-tuples): (node type, node content)

        To simplify checking for types of character sequences ('free text', 'html expressions', 'latex expressions') we
        convert the input string into a list of characters or sequences of characters indicating the text strings and
        delimiters.  We can then do simple counting to find matching pairs of delimiters and detect mismatched cases
        (where an html expression or latex expression is not wholly contained in a single element of the other).

        There are several cases:
          (1) '\...{' - open latex expression.  Only ordinary text allowed.
          (2) '{' - multiple arguments in latex expression.  May be preceded by '}' or '} whitespace'
          (3) '}' - close latex expression.
          (4) '<...>' - open html expression.  No '\', '{', '}', '/', '<'.  allowed.
          (5) '</...>' - close html expression.  Only ordinary text allowed.
          (6) '<.../>' - self closing html.  No '\', '{', '}', '/', '<'. '>' allowed.
          (7) 'free text' - no '>' allowed.
        To avoid problems that confuse backslashes in latex, with python and regex escape sequences we
              modify the searched string by replacing backslashes with an unused but otherwise normal char ('\a') and
              modify the regex expressions to search for them.
        These regex expressions use an '@' sign where an ascii BEL ('\a') should be, then replace it with the BEL
        Input strings containing a '\' replace the backslash with a BEL
        Processing of the results of matches should remove all BEL's, but any left are converted back to
              backslashes after processing."""
        latex_open = r'(?P<LOpen>@[\w ]+{)'.replace('@', '\a')  # \xxxx{
        latex_multiple = r'(?P<LMult>}\s*{)'  # }{
        latex_close = r'(?P<LClose>})'  # }
        html_open = r'(?P<HOpen><[^><&@/]+>)'.replace('@', '\a')  # <tag attributes>
        html_close = r'(?P<HClose></[^><&@/]+>)'.replace('@', '\a')  # </tag>
        html_self_close = r'(?P<HSelf><[^><&@/]+/>)'.replace('@', '\a')  # <tag attributes/>
        free_text = r'(?P<Free>[^@<>{}]+)'.replace('@', '\a')  # text
        tmp = ''.join(['(', latex_open, '|', latex_multiple, '|', latex_close, '|', html_close, '|', html_self_close,
                       '|', html_open, '|', free_text, ')'])

        txt_parse = re.compile(tmp)
        txt_positions = []
        for match in re.finditer(txt_parse, txt.replace('\\', '\a')):
            tmp = [(k, v) for k, v in match.groupdict().items() if v][0]
            txt_positions.append(tmp)
        return txt_positions

    def _parse_whole_text(self, txt):
        try:
            txt_strings = self._create_delimited_strings(txt)
            te = TopElement(txt_strings, self.db_session)
            te.parse()
            res = te.render()
            self.content_features = te.get_content_features()
            return res

        except Exception as e:
            raise e

    def build_html_output_tree(self):
        all_text = ElementTree.tostring(self.html_etree).decode()
        try:
            res = self._parse_whole_text(all_text)
            return res.replace('\a', '\\')  # Replace ASCII BEL with backslash (reverse earlier translation)
        except Exception as e:
            foo = 3

    # def _element_html(self, item):
    #     """Body is our top level element.  The document is assumed to contain no header information."""
    #     return '<body>'
    #
    # def _element_p(self, item):
    #     return '<p>'
    #
    # def _element_span(self, item):
    #     return '<span>'
    #
    # def _element_em(self, item):
    #     return '<em>'
    #
    # def _element_strong(self, item):
    #     return '<strong>'
    #
    # def _element_h1(self, item):
    #     return '<h1>'
    #
    # def _element_h2(self, item):
    #     return '<h2>'
    #
    # def _element_h3(self, item):
    #     return '<h3>'
    #
    # def _element_h4(self, item):
    #     return '<h4>'
    #
    # def _element_sup(self, item):
    #     return '<sup>'
    #
    # def _element_img(self, item):
    #     return '<h4>IMG NEEDED</h4>'
    #
    # def _element_x(self, item):
    #     return '<x>'
    #
    # def _element_x(self, item):
    #     return '<x>'
    #
    # def _element_x(self, item):
    #     return '<x>'
    #
    # def _element_x(self, item):
    #     return '<x>'
    #
    # def _element_a(self, item):
    #     return f'<h2>Element "a" found: {item}</h2>'

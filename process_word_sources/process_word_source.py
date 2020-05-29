from lxml import etree
from lxml.html import html5parser as hp
from xml.etree import ElementTree
from utilities.sst_exceptions import WordHTMLExpressionError, WordLatexExpressionError, WordInputError, \
    WordRenderingError, WordContentFeature, PhotoOrGalleryMissing
from utilities.miscellaneous import factor_string
from db_mgt.db_exec import DBExec
from .parse_debug import find_string_in_parsed_result as fs

import re
import mammoth

XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
XHTML = "{%s}" % XHTML_NAMESPACE
NSMAP = {None: XHTML_NAMESPACE}


def verify(string_to_add):
    if string_to_add.find('OCTY') != -1:
        foo = 3
    return string_to_add


def remove_useless_html(in_source: str) -> str:
    """Remove HTML added by docx converter that is irrelevant for our use.

    (1) <a id="__DdeLink..."/>  inserted after '{' of (some) Latex expressions.
    """
    re1 = re.compile(r'<a id="..DdeLink.+?"></a>')
    return re.sub(re1, '', in_source)


# TODO: 'snippet_only' not yet implemented
predefined_environments = ['snippet', 'layout', 'sign', 'table', 'container', 'element']


class ParsedElement(object):
    """ Base class to represent elements of the parse and support expansion.
    """

    def __init__(self, element_type, source, parent):
        self.element_type = element_type
        self.source = source
        self.parent = parent
        self.result = None  # Set only on highest parent
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
        el_save = None
        el_item = None
        ndx_save = None
        try:
            while True:
                if ndx >= max_ndx:
                    return ndx
                el, item = self.source[ndx]
                verify(item)
                el_save = el
                ndx_save = ndx
                el_item = item
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
            self.top.db_exec.add_error_to_form('Except', f'{e.args}')
            self.top.db_exec.add_error_to_form('ParseElement',
                                               f'Element: {el_save}, "{self.source[ndx_save: ndx_save + 20]}"')
            raise e

    def render(self):
        res = ''
        for node in self.parsed_result:
            if type(node) == tuple:
                try:
                    el, item = node
                    if el == 'HSelf':
                        res += str(item)
                    else:
                        res += '<UnrendredElement>' + verify(str(node)) + '</UnrendredElement>'
                except Exception as e:
                    raise e
            else:
                try:
                    res += verify(str(node.render()))
                except Exception as e:
                    self.top.db_exec.add_error_to_form('Render_fail', f'Node: {node}')
                    raise e
        if self.element_type == 'Top':
            self.result = res
            return res
        else:
            return '<UnrendredElement>' + verify(res) + '</UnrendredElement>'


class TopElement(ParsedElement):
    def __init__(self, source_list, db_exec: DBExec):
        self.db_exec = db_exec
        self.environments = dict()
        self.environments_by_name = dict()  # Environments must have unique names, independent of type.
        self.environment_stack = list()  # Environments that control interpretation set/cleared by latex expressions
        self.environment_types = ['snippet', 'layout']
        self.text_segments = None  # result of parse breaking input text into segments broken at environment bounds
        self.dupe_para_segments = []
        self.photo_mgr = db_exec.create_sst_photo_manager()
        self.photo_frames = dict()
        self.current_photo_frame = None
        self.content_features = dict()  # A dictionary of things found in the parse (e.g, title) useful to parents
        super().__init__('Top', source_list, None)
        pass

    def parse(self):
        super().parse()
        return self

    def get_environment_types(self):
        return self.environment_types

    def get_type_of_current_environment(self):
        if self.environment_stack:
            env_name = self.environment_stack[-1]
            return self.environments_by_name[env_name]['type']
        else:
            return None

    def get_current_environment(self):
        if self.environment_stack:
            env_name = self.environment_stack[-1]
            return self.environments_by_name[env_name]
        else:
            return None

    def open_environment(self, env_type_name: str, env_name: str) -> dict:
        """Open a new or existing environment.

        An environment is a named dictionary that may be used to provide information or control operation of
        the system.  Environments may be created during the parsing of a document (or created externally). Any
        specific environment may not be nested.  A specific type of environment (env name) may occur multiple times
        that do not overlap. The name of each environment is an entry in the environment with the name '__name__'.

        The system maintains a dictionary of environments each know by an environment type (such as snippet).  For each
        such type, the system maintains a list of environments of that type.  Each of which has it's own name.

        Args:
            env_type_name: (str) name of the environment type.
            env_name: (str) - name of the specific environment

        Returns:
            (dict) (mutable) dictionary to hold content of the environment.
        """
        if env_name in self.environment_stack or env_name in self.environments_by_name:
            raise WordInputError(f'Environment: {env_name} already exists.')
        else:
            new_env = dict()
            new_env['__name__'] = env_name
            new_env['type'] = env_type_name
            new_env['args'] = []
            self.environment_stack.append(env_name)
            self.environments_by_name[env_name] = new_env
            if env_type_name in self.environments:
                self.environments[env_type_name].append(new_env)
            else:
                self.environments[env_type_name] = [new_env]
            return new_env

    def add_environment_arg(self, env_type, env_name, arg):
        if env_type not in self.environments:
            raise WordInputError(f'Environment: {env_type} does not exist.')
        env_list = self.environments[env_type]
        for env in env_list:
            if env_name in env:
                env['args'].append(arg)

    def get_environment_type(self):
        env_name = self.environment_stack[-1]
        env = self.environments_by_name[env_name]
        return env['type']

    def close_environment(self, env_name):
        if self.environment_stack and self.environment_stack[-1] != env_name:
            raise WordInputError(f'Environment: {env_name} not most recently created environment.')
        else:
            self.environment_stack.pop()

    def add_photo_frame(self, name):
        if name in self.photo_frames.keys():
            raise WordLatexExpressionError(f'Photo Frame {name} exists.')
        new_frame = self.photo_mgr.get_slideshow(self.db_exec, name)
        self.photo_frames[name] = new_frame
        self.current_photo_frame = new_frame
        return new_frame

    def clear_current_frame(self, arg):
        # if self.current_photo_frame.name != arg:
        #     raise WordLatexExpressionError(f'Attempt to clear wrong photo frame: {arg}')
        self.current_photo_frame = None

    def get_photo_frame(self, name):
        if name in self.photo_frames.keys():
            return self.photo_frames[name]
        else:
            raise WordLatexExpressionError(f'Photo Frame {name} does not exist.')

    # Content features are intended to provide a mechanism for accumulating information
    # while processing a document that may be useful at a higher level such as placing the
    # title in the database.
    # A content feature is itself a dictionary into which values may be accumulated as needed.
    # Note that the value is a dictionary or list of dictionaries to allow for user defined
    # items such as an environment that is not a recognized type.  Content feature names are
    # generally recognizable names so that the system may invoke a dedicated handler, though
    # unknown names have their own dedicated handler.
    # Note also that the content feature for 'newform' (Latex expression) has as its value
    # a list of 'arguments' each of which is itself a list (generally with 1 item).
    def get_content_features(self):
        return self.content_features

    def add_content_feature(self, feature_name, name, value):
        if feature_name not in self.content_features:
            self.content_features[feature_name] = dict()
        feature_dict = self.content_features[feature_name]
        if name in feature_dict:
            if type(feature_dict[name]) is list:
                feature_dict[name].append(value)
            else:
                raise WordContentFeature(f'Feature: {feature_name} attempt to replace value of {feature_dict[name]}')
        else:
            feature_dict[name] = value

    def add_content_feature_list(self, feature_name):
        """Add new content feature"""
        if feature_name in self.content_features.keys():
            raise WordContentFeature(f'Feature: {feature_name} has already been added')
        else:
            self.content_features[feature_name] = dict()

    def get_content_feature_value(self, feature, feature_name):
        if feature in self.content_features and feature_name in self.content_features[feature]:
            return self.content_features[feature][feature_name]
        else:
            return None

    def get_result(self):
        return self.result

    def _create_delimited_strings(self, txt):
        """Post process to establish environments, do clean-up.

        :param txt: str
        :return: None,  creates environment specs and breaks source into list of pieces for later joining.
"""
        para_dupes = r'(?P<Para><p></p>(<p></p>)*)'.replace('@', '\a')  # remove replicated paras
        html_open = r'(?P<HOpen><[^><&@/]+?>)'.replace('@', '\a')  # <tag attributes>
        html_close = r'(?P<HClose></[^><&@/]+?>)'.replace('@', '\a')  # </tag>
        html_self_close = r'(?P<HSelf><[^><&@/]+?/>)'.replace('@', '\a')  # <tag attributes/>
        free_text = r'(?P<Free>[^@<>{}]+?)'.replace('@', '\a')  # text
        start_env = r'(?P<EOpen><p>\s*?<!--\[\[open_env(,(\w+))*?\s*?]]-->\s*?</p>)'.replace('@', '\a')
        close_env = r'(?P<EClose><p>\s*?<!--\[\[close_env(,(\w+))*?\s*?]]-->\s*?</p>)'.replace('@', '\a')
        start_layout = r'(?P<LOpen><p>\s*?<!--\[\[open_layout(,(\w+))*?\s*?]]-->\s*?</p>)'.replace('@', '\a')
        close_layout = r'(?P<LClose><p>\s*?<!--\[\[close_layout(,(\w+))*?\s*?]]-->\s*?</p>)'.replace('@', '\a')
        tmp = ''.join(
            ['(', para_dupes, '|', start_env, '|', close_env, '|', start_layout, '|', close_layout, '|',
             html_close, '|', html_self_close, '|', html_open, '|', free_text, ')'])
        try:
            txt_parse = re.compile(tmp)
            txt_positions = []
            nxt_position = 1
            for match in re.finditer(txt_parse, txt.replace('\\', '\a')):
                tmp = [(k, v) for k, v in match.groupdict().items() if v]  # k: group name, v: matched content
                if tmp:
                    tmp = tmp[0]
                if tmp[0] in ['EOpen', 'EClose', 'LOpen', 'LClose', 'Para']:
                    match_type = tmp[0]
                    match_start = match.start()
                    match_end = match.end()
                    # !!! This construct is to avoid the fact that the matcher is sometimes returning None(s)
                    #      where it should be matching.  Regex has been tested with online tester, so more debugging
                    #      needed.  This is a workaround. May still have ',' in match name.
                    match_name = ''
                    if match_type != 'Para':
                        match_name = [x for x in match.groups()[2:] if x][1].replace(',', '')
                    # print(f'{match_type}  value: {match_name} start: {match_start} end: {match_end}')

                    # match_details = match_text, match_type, match_name, match_start, match_end, nxt_position
                    #     where match_text = entire content of the matched expression
                    #           match_type in ['EOpen', 'EClose', 'LOpen', 'LClose', 'Para']
                    #           match_name = name enclosed in braces
                    #           match_start, match_end = location of matched string in input text
                    match_details = (match.group(0), match_type, match_name, match_start, match_end, nxt_position)
                    if match_type == 'EOpen':
                        self._process_env_open(match_details)
                    elif match_type == 'EClose':
                        self._process_env_close(match_details)
                    elif match_type == 'LOpen':
                        self._process_layout_open(match_details)
                    elif match_type == 'LClose':
                        self._process_layout_close(match_details)
                    elif match_type == 'Para':
                        self.dupe_para_segments.append(nxt_position)
                    else:
                        raise ValueError(f'Match Type: {match_type} is not recognized.')
                    txt_positions += [match_start, match_end]
                    nxt_position += 2
            if txt_positions:
                self.text_segments = factor_string(txt.replace('\a', '\\'), txt_positions)
            else:
                self.text_segments = [txt]  # This occurs in the case of a Word doc with no embedded LaTeX
            for seg in self.dupe_para_segments:
                self.text_segments[seg] = '<p></p>'
            return
        except Exception as e:
            foo = 3
            raise e

    def _process_env_open(self, match_details):
        match_text, match_type, match_name, match_start, match_end, nxt_position = match_details
        env = self.environments_by_name[match_name]
        env['text_list_start_pos'] = nxt_position
        env['type'] = match_name

    def _process_env_close(self, match_details):
        match_text, match_type, match_name, match_start, match_end, nxt_position = match_details
        env = self.environments_by_name[match_name]
        env['text_list_end_pos'] = nxt_position  # begin segment after content

    def _process_layout_open(self, match_details):
        match_text, match_type, match_name, match_start, match_end, nxt_position = match_details
        env = self.environments_by_name[match_name]
        env['text_list_start_pos'] = nxt_position
        env['type'] = 'layout'
        env['layout_name'] = match_name

    def _process_layout_close(self, match_details):
        match_text, match_type, match_name, match_start, match_end, nxt_position = match_details
        env = self.environments_by_name[match_name]
        env['text_list_end_pos'] = nxt_position  # begin segment after content

    def _process_environments(self):
        """Modify/generate html associated with environments and capture any features."""
        for env_name, env_list in self.environments.items():
            for env in env_list:
                if 'type' in env and 'text_list_start_pos' in env and 'text_list_end_pos' in env:
                    env_type = env['type']
                    snip_text_begin = env['text_list_start_pos']
                    snip_text_end = env['text_list_end_pos']
                    self.text_segments[snip_text_begin] = ''
                    self.text_segments[snip_text_end] = ''
                    snip_text = ''.join(self.text_segments[snip_text_begin + 1:snip_text_end])
                    if env_type == 'snippet':
                        self.add_content_feature('snippet', 'snippet', snip_text)
                        # TODO: if snippet is not to be left alone, need to remove intermediate text
                    elif env_type == 'layout':
                        # Layout environments are discriminated by their "name" (first argument).  The actual
                        # name of the specific environment is the second argument.  This avoid the issue of
                        # requiring separate post process handlers for each kind (sub-type) of layout.
                        if env_name not in predefined_environments:
                            raise SystemError(f'Invalid type of layout environment: {env_name}')
                        self._process_layout_environment(env, env_name, snip_text_begin, snip_text_end)
                    elif env_type == 'user_environment':
                        self._process_user_environment(env, env_name, snip_text_begin, snip_text_end)
                    else:
                        self.add_content_feature(env_type, env_name, snip_text)
                else:
                    if 'type' not in env:
                        self.db_exec.add_error_to_form('Missing Layout Parameter',
                                                       f'{env_name} has no type specified')
                    if 'text_list_start_pos' not in env:
                        self.db_exec.add_error_to_form('Missing Layout Parameter',
                                                       f'{env_name} start missing/broken\n   Note that this is often' +
                                                       'caused by text on the same line following the closing brace')
                    if 'text_list_end_pos' not in env:
                        self.db_exec.add_error_to_form('Missing Layout Parameter',
                                                       f'{env_name} end specifier missing\n   Note that this is often' +
                                                       'caused by text on the same line following the closing brace')
                    # raise SystemError(f'No Environment Type given for environment named: {env_name}')
        return

    def _process_user_environment(self, env, env_type, snip_start, snip_stop):
        open_html = f''
        close_html = f''
        result_html = f''
        self._process_text_snips(open_html, result_html, close_html, snip_start, snip_stop)

    def _process_layout_environment(self, env, env_type, snip_start, snip_stop):
        if env_type == 'snippet':
            self._process_layout_snippet_environment(env, snip_start, snip_stop)
        elif env_type == 'sign':
            self._process_layout_sign_environment(env, snip_start, snip_stop)
        elif env_type == 'table':
            self._process_layout_table_environment(env, snip_start, snip_stop)
        elif env_type == 'container':
            self._process_layout_container_environment(env, snip_start, snip_stop)
        elif env_type == 'element':
            self._process_layout_element_environment(env, snip_start, snip_stop)
        else:
            raise SystemError(f'Fell off end of environment checks')

    def _process_text_snips(self, open_html, result_html, close_html, snip_start, snip_stop):
        self.text_segments[snip_start] = open_html
        self.text_segments[snip_stop] = close_html
        if snip_stop - snip_start > 2:
            all_segments = self.text_segments[snip_start + 1]
            for n in range(snip_start + 2, snip_stop):
                all_segments += self.text_segments[n]
                self.text_segments[n] = ''
            self.text_segments[snip_start + 1] = all_segments
        self.text_segments[snip_start + 1] = result_html + self.text_segments[snip_start + 1]

    def _process_layout_snippet_environment(self, env, snip_start, snip_stop):
        # We need to identify the components of the layout and stitch them together properly
        open_html = f'<container class="container-fluid clearfix">'
        for arg in env['args']:
            open_html += f'<p>Layout Argument: {arg}</p>'
        close_html = f'</container><div class="clearfix"></div>'
        result_html = ''
        self._process_text_snips(open_html, result_html, close_html, snip_start, snip_stop)

    def _process_layout_sign_environment(self, env, snip_start, snip_stop):
        open_html = f''
        close_html = f''
        result_html = f''
        self._process_text_snips(open_html, result_html, close_html, snip_start, snip_stop)

    def _process_layout_table_environment(self, env, snip_start, snip_stop):
        open_html = f'<container class="container-fluid clearfix">'
        for arg in env['args']:
            open_html += f'<p>Layout Argument: {arg}</p>'
        close_html = f'</container><div class="clearfix"></div>'
        result_html = ''
        self._process_text_snips(open_html, result_html, close_html, snip_start, snip_stop)

    def _process_layout_container_environment(self, env, snip_start, snip_stop):
        open_html = f''
        close_html = f''
        result_html = f''
        self._process_text_snips(open_html, result_html, close_html, snip_start, snip_stop)

    def _process_layout_element_environment(self, env, snip_start, snip_stop):
        open_html = f''
        close_html = f''
        result_html = f''
        self._process_text_snips(open_html, result_html, close_html, snip_start, snip_stop)

    def post_process(self):
        """Post process resultant HTML (as string) for cleanup and environment handling.

        Cleanup:
            (1) Remove '<p></p>' elements.
        Environments:
            (1) Find snippet and create feature to be returned.
            (2) Find layouts and surround with proper div element and class.
        """
        self._create_delimited_strings(self.result)
        self._process_environments()
        self.result = ''.join(self.text_segments)


class FreeElement(ParsedElement):
    """Represents elements containing neither HTML nor Latex structure."""

    def __init__(self, item, source_list, parent):
        super().__init__('Free', source_list, parent)
        self.source_item = item

    def render(self, renderer=None):
        parent_type = self.get_parent_type()
        if not renderer:
            if parent_type == 'HTML':
                return verify(self.source_item)
            elif parent_type == 'Latex':
                return verify(self.source_item)
            elif parent_type == 'Top':  # Free standing element not in expression => at start or end
                return '<span>' + verify(self.source_item) + '</span>'  # Can this span be removed???
            else:
                raise WordInputError(f'Invalid element type: {parent_type}')
        else:
            return renderer(verify(self.source_item))


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
        self.command_processors['layout'] = self._latex_begin_layout
        self.command_processors['endlayout'] = self._latex_end_layout
        self.command_processors['figure'] = self._latex_begin_figure
        self.command_processors['endfigure'] = self._latex_end_figure
        self.command_processors['photoset'] = self._latex_photoset
        self.command_processors['photo'] = self._latex_photo
        self.command_processors['photos'] = self._latex_photo
        self.command_processors['phototitle'] = self._latex_photo_title  # note that just 'title' is different
        self.command_processors['photoposition'] = self._latex_photo_position
        self.command_processors['position'] = self._latex_photo_position  # duplicate reflecting actual source
        self.command_processors['photorotation'] = self._latex_photo_rotation
        self.command_processors['rotation'] = self._latex_photo_rotation
        self.command_processors['placefigure'] = self._latex_place_figure
        self.command_processors['photosize'] = self._latex_photo_size
        self.command_processors['size'] = self._latex_photo_size
        self.command_processors['newform'] = self._latex_newform

        self.command_processors['XXX'] = self

    def process_opening_node(self):
        self.parsed_result.append(('Open', self.source_item[1:-1]))  # Remove backslash and left brace

    def render(self):
        try:
            res = ''
            for ndx, el_structure in enumerate(self.parsed_result):
                if type(el_structure) == tuple:
                    el, item = el_structure
                    if el == 'Open':
                        self.command = item.strip()
                    elif el == 'NewArg':
                        self.args.append(list())
                    elif el == 'Close':
                        res += self._render_from_args()
                    else:
                        source = self.parsed_result[ndx]
                        raise WordLatexExpressionError(f'Invalid Latex node type: {el} with source: {source}')
                else:
                    if len(self.args) > 0:
                        tmp = el_structure.render()
                        self.args[-1].append(tmp)
                    else:
                        raise SystemError(f'System error - invalid length in args structure in Latex Element render')
            return res
        except PhotoOrGalleryMissing as e:
            raise e
        except Exception as e:
            raise WordLatexExpressionError(f'Error in Latex Element render: {el_structure}')

    def _render_from_args(self):
        """All args processed, so now can render properly."""
        try:
            if self.command in self.command_processors:
                cmd = self.command_processors[self.command]
                tmp = cmd()
                return tmp
            else:
                el = 'LATEXElement_' + self.command
                return '<' + el + ' El:' + el + 'Has: ' + str(len(self.args)) + ' args</ ' + el + '>'
        except Exception as e:
            self.top.db_exec.add_error_to_form('Render_from_Args', f'Exception: {e.args}')
            self.top.db_exec.add_error_to_form('Render_from_Args', f'Command: {self.command}')
            raise e

    def _latex_textbf(self):
        res = '<strong>'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex Bold called with wrong args: {self.args}')
        arg = self.args[0][0]
        res += str(arg)
        return verify(res + '</strong>')

    def _latex_textif(self):
        res = '<em>'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex Italics called with wrong args: {self.args}')
        arg = self.args[0][0]
        res += str(arg)
        return verify(res + '</em>')

    def _latex_underline(self):
        res = '<span style="text-decoration:underline">'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex Underline called with wrong args: {self.args}')
        arg = self.args[0][0]
        res += str(arg)
        res += '</span>'
        return verify(res)

    def _latex_title(self):
        res = '<div class="title">'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex title called with wrong args: {self.args}')
        arg = self.args[0][0]
        super().get_top().add_content_feature('title', 'title', arg)
        res += str(arg)
        res += '</div>'
        return verify(res)

    def _latex_byline(self):
        res = '<div class="byline">'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex title called with wrong args: {self.args}')
        arg = self.args[0][0]
        super().get_top().add_content_feature('byline', 'byline', arg)
        res += str(arg)
        res += '</div>'
        return verify(res)

    def _latex_subtitle(self):
        res = '<div class="subtitle">'
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex subtitle called with wrong args: {self.args}')
        arg = self.args[0][0]
        res += str(arg)
        res += '</div>'
        return verify(res)

    def _latex_begin_env(self):
        # args[0] is env name
        # args[1:] are arguments to control environment
        try:
            arg = self.args[0][0]
            top_element = super().get_top()
            if arg in top_element.get_environment_types():
                top_element.open_environment(arg, arg)
            else:
                top_element.open_environment('user_environment', arg)
            for val in self.args[1:]:
                top_element.add_environment_arg('user_environment', arg, val)
        except Exception as e:
            raise SystemError(f'in _latex_begin_env: {e.args}')
        #  Use comment to support RE finding relevant text in post fixup.
        res = '<!--[[open_env,' + arg + ' ]]-->'
        return res

    def _latex_end_env(self):
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex end environment called with wrong args: {self.args}')
        arg = self.args[0][0]
        top_element = super().get_top()
        top_element.close_environment(arg)
        return '<!--[[close_env,' + arg + ' ]]-->'

    def _latex_begin_layout(self):
        # args[0][0] is layout name
        # args[1][0] is layout type
        # args[2:] are arguments to specific layout environment
        top_element = super().get_top()
        if len(self.args) < 2:
            self.top.db_exec.add_error_to_form('Layout Args', f'Insufficient args to layout')
            res = '<!--[[open_layout,  UNKNOWN   FAILED: Insufficient arguments ]]-->'
            return res
        layout_name = self.args[0][0]
        layout_type = self.args[1][0]
        if layout_type not in predefined_environments:
            self.top.db_exec.add_error_to_form('Layout Args', f'Unknown layout: {layout_type}')
            res = f'<!--[[open_layout, {layout_name} FAILED: Unknown type {layout_type} ]]-->'
            return res
        #  Use comment to support RE finding relevant text in post fixup.
        top_element.open_environment(layout_type, layout_name)
        res = f'<!--[[open_layout,{layout_name}]]-->'
        for val in self.args[2:]:
            top_element.add_environment_arg(layout_type, layout_name, val)
        return res

    def _latex_end_layout(self):
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex endlayout called with wrong args: {self.args}')
        arg = self.args[0][0]
        top_element = super().get_top()
        env_type = top_element.get_environment_type()
        top_element.close_environment(arg)
        return f'<!--[[close_layout,{arg}]]-->'

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
        except PhotoOrGalleryMissing as e:
            self.top.db_exec.add_error_to_form('Make Photoset', f'Missing Photo(s) or Gallery: {photo_list_text}')
            raise e
        return ''

    def _latex_photo(self):
        photo = self.args[0][0]
        caption = None
        if len(self.args) > 1:
            caption = self.args[1][0]
        try:
            top_element = super().get_top()
            tmp = photo.strip()
            if tmp.isdigit():
                photo_id = int(tmp)
            else:
                photo_mgr = self.top.db_exec.create_sst_photo_manager()
                photo_tmp = photo_mgr.get_photo_from_slug(tmp)
                if photo_tmp and photo_tmp.id:
                    photo_id = photo_tmp.id
                else:
                    self.top.db_exec.add_error_to_form('Add Photo', f'No such Photo: {tmp}')
                    raise PhotoOrGalleryMissing(f'Missing photo: {tmp}')
            if caption:
                top_element.current_photo_frame.add_caption(caption)
            top_element.current_photo_frame.add_photo(photo_id)
        except Exception as e:
            self.top.db_exec.add_error_to_form('Add Photo', f'Missing Photo(s) or Gallery: {photo}')
            raise e
        return ''

    def _latex_photo_title(self):
        top_element = super().get_top()
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex end figure called with wrong args: {self.args}')
        arg = self.args[0][0]
        top_element.current_photo_frame.add_title(arg)
        return ''

    def _latex_photo_position(self):
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
            arg_int = int(arg)
        except Exception as e:
            raise WordLatexExpressionError(f'Latex invalid value for photo frame rotation speed: {arg_int}')
        top_element.current_photo_frame.set_rotation(arg_int)
        return ''

    def _latex_place_figure(self):
        # if this occurs inside a Layout - then we attach the figure to the layout and let it be expanded
        # when environments are processed after parsing
        top_element = super().get_top()
        arg = self.args[0][0]
        frame = top_element.get_photo_frame(arg)
        if len(self.args) != 1:
            raise WordLatexExpressionError(f'Latex end figure called with wrong args: {self.args}')
        if top_element.get_type_of_current_environment() == 'layout':
            env = top_element.get_current_environment()
            if 'figures' in env:
                env['figures'].append(frame)
            else:
                env['figures'] = [frame]
            return ''
        else:
            return verify(frame.get_html())

    def _latex_newform(self):
        top_element = super().get_top()
        if len(self.args):
            name = self.args[0][0]
            top_element.add_content_feature('newform', name, self.args[1:])
        return ''

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
        easy addition of new features (such as finding empty 'span'  or 'p' elements, adding
        css classes, ..."""
        try:
            res = ''
            el_save = None
            el_item = None
            for el_structure in self.parsed_result:
                if type(el_structure) == tuple:
                    el, item = el_structure
                    el_save = el
                    el_item = item
                    if el == 'Open':
                        res += str(item)  # Should not need str - unless there is an error
                    elif el == 'HSelf':
                        res += item
                    elif el == 'Close':
                        res += item
                    else:
                        raise WordLatexExpressionError(f'Invalid structure type in Latex node: {el}')
                else:
                    if el_structure.element_type == 'Latex' and el_structure.command == 'layout':
                        foo = 3
                    tmp = el_structure.render()
                    res += tmp
            return verify(res)
        except Exception as e:
            self.top.db_exec.add_error_to_form('Render_Fail_err', f'{e.args}')
            self.top.db_exec.add_error_to_form('Render_Fail', f'Element: {el_save}, Item: {str(el_item)[0:30]}...')
            raise WordRenderingError(f'Unspecified Error in Word Render')


class WordSourceDocument(object):
    """Convert marked up Document in MS Word format to HTML.

    """

    def __init__(self, db_exec: DBExec, logger):
        self.logger = logger
        self.db_exec = db_exec
        self.docx_source = None
        self.content_features = dict()
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

    def set_source_path(self, path):
        self.docx_source = path

    def read_docs_as_html(self):
        # Translate DOCX to HTML
        try:
            with open(self.docx_source, 'rb') as docx_file:
                result = mammoth.convert_to_html(docx_file)
                html = result.value
                html = remove_useless_html(html)
                html_only = '<html>' + verify(html) + '</html>'
                self.html_etree = etree.fromstring(html_only)
        except Exception as e:
            self.db_exec.add_error_to_form('Read_docx_failure', 'Error converting docx to html')
            self.db_exec.add_error_to_form('Read_docx_failure', f'{e.args}')
            self.logger.make_error_entry(f'Fail to create HTML from {self.docx_source}')
            raise e

    def read_docs_from_string(self, in_string):
        """Set reader as if input is already html"""
        self.html_etree = etree.fromstring(in_string)

    def _find_last_element_in_nested_list(self, res):
        if type(res) == list:
            return self._find_last_element_in_nested_list(res[-1])
        else:
            return res

    def get_content_features(self):
        return self.content_features

    def get_specific_content_feature(self, feature_name):
        if feature_name in self.content_features:
            return self.content_features[feature_name]
        else:
            return None

    def get_content_feature_value(self, feature, feature_name):
        if feature in self.content_features and feature_name in self.content_features[feature]:
            return self.content_features[feature][feature_name]
        else:
            return None

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
            te = TopElement(txt_strings, self.db_exec)
            te.parse()
            te.render()
            te.post_process()
            res = te.get_result()
            verify(res)
            self.content_features = te.get_content_features()
            return res
        except Exception as e:
            self.db_exec.add_error_to_form('Parse_text', 'Error in WordSourceDocument._parse_whole_text')
            self.db_exec.add_error_to_form('Parse_text', f'{e.args}')
            raise e

    def build_html_output_tree(self):
        all_text = ElementTree.tostring(self.html_etree).decode()
        try:
            res = self._parse_whole_text(all_text)
            verify(res)
            return res.replace('\a', '\\')  # Replace ASCII BEL with backslash (reverse earlier translation)
        except Exception as e:
            self.db_exec.add_error_to_form('Parse_text', 'Error in WordSourceDocument.build_html_output_tree')
            self.db_exec.add_error_to_form('Parse_text', f'{e.args}')
            raise e

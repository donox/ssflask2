import re
from utilities.html_mgt import PageBody
from utilities.shortcodes import Shortcode
from lxml.html import html5parser as hp
import lxml
from flask import render_template
from config import Config


class Story(object):
    """
        The Story object represents an individual article that may exist on the website.

        The empty story object is initially instantiated.  Content can be loaded externally
        and saved to disk, loaded from disk, or created at random.

        Args:
            arg (str): The arg is used for...
            *args: The variable arguments are used for...
            **kwargs: The keyword arguments are used for...

        Attributes:
            arg (str): This is where we store arg,
        """

    def __init__(self, session, width):
        width_sizes = {3: 'is-one-quarter',
                       4: 'is-one-third',
                       6: 'is-half',
                       8: 'is-two-thirds',
                       12: 'is-full'}
        self.story = dict()
        self.pb = None  # PageBody
        self.session = session
        self.snippet_width = width       # Width to display on front page in columns (1-12)
        self.story['width'] = width
        self.story['width-class'] = None
        if width in width_sizes.keys():
            self.story['width-class'] = width_sizes[width]
        self.read_more = None


    def create_snippet(self, max_length=250):
        """Create a snippet as an Intro for front page or like.

        Args:
            max_length: Maximum number of chars in the snippet content

        Returns:
            A story title and first paragraph as html elements
        """
        self.story['snip'] = self._create_snippet_text(max_length=max_length)
        return self.story

    def _create_snippet_text(self, max_length=250):
        remain_len = max_length
        txt = ''
        for el in self.pb.body.iter():
            if el.text:
                if remain_len < len(el.text):
                    txt += el.text[0:remain_len]
                else:
                    txt += el.text + ' '
                remain_len -= len(txt)
                if remain_len <= 0:
                    return txt
        return txt

    def _create_read_more(self):
        """Create parameters for a button to go in a button transferring to this page"""
        self.add_to_context('button_type','is-link')
        self.add_to_context('extra_styling', 'margin:4px; color:red')
        self.add_to_context('target', '/main/page/{}'.format(self.pb.page_in_db.id))
        self.add_to_context('text_content', 'Read More')

    def get_read_more(self):
        return self.read_more

    def create_story_from_db(self, page_id=None, page_name=None):
        self.pb = PageBody(self.session)
        self.pb.load_from_db(page_id=page_id, page_name=page_name)
        # Expand shortcodes

        sc_list = self.pb.find_shortcodes()
        for shortcode in sc_list:
            sc, elem, start, end = shortcode
            sc_string = elem.text[start:end]
            sc_obj = Shortcode(self.session, sc_string)
            sc_obj.parse_shortcode()
            sc_obj.process_shortcode()
            if 'result' in sc_obj.content_dict.keys():
                # TODO: Failure seems to come from failure to parse shortcode (not implemented?) - ignore for now
                #       Failure also comes from failure to fetch data from database
                # Result is a string replacement for a short code.  We use lxml to generate etree elements from
                # the result.  lxml will add surrounding html elements, so we select the body content which we can
                # then append to the growing etree representing the story.
                replacement = sc_obj.content_dict['result']
            else:
                # Shortcode did not process - either an error in the shortcode or failure to fetch from DB
                replacement = '<p style="font-weight:bold">Shortcode: {} : Failed to process</p>'.format(sc_string)
            res = lxml.html.document_fromstring(replacement, ensure_head_body=False)
            res1 = res.find('body/*')
            txt = elem.text
            elem.text = ''
            el = PageBody.create_empty_element('scan')
            el.text = txt[0:start]
            if el.text is not '':
                elem.append(el)
            elem.append(res1)
            el = PageBody.create_empty_element('scan')
            el.text = txt[end:]
            if el.text is not '':
                elem.append(el)

        if False:                       # TODO: REMOVEQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ
            self.pb.update_cached_page()
        title, tab_title, story = self.pb.get_title_body()
        self.story['title'] = title
        self.story['tab_title'] = tab_title
        self._create_read_more()
        try:
            body = lxml.html.tostring(story, method='html').decode('utf-8')
            foo = 3
        except Exception as e:
            print(e.args)
            raise e
        self.story['body'] = body

    def add_to_context(self, item, value):
        self.story[item] = value


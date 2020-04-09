from lxml.html import html5parser as hp
from lxml import etree
import lxml
from xml.etree.ElementTree import tostring
import copy
from db_mgt.page_tables import Page, PageMeta
import re
from utilities.shortcodes import Shortcode
from utilities.sst_exceptions import SiteObjectNotFoundError, SiteIdentifierError

XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
XHTML = "{%s}" % XHTML_NAMESPACE
NSMAP = {None: XHTML_NAMESPACE}

def find_null_elements(el: etree.Element):
    """Make count of elements containing some text."""
    count = 0
    for elt in el.getchildren():
        if elt.text or elt.tail:
            count += 1
        if len(elt):
            count += find_null_elements(elt)
    return count


class PageBody(object):
    """Utility operations to organize and structure the body of an html page.
    """
    def __init__(self, db_exec):
        # TODO: set directories via config
        self.working_dir = '/home/don/devel/flaskSamples/'
        self.doc_as_html = None  # Not set if page is loaded from database
        self.title = None  # If html element use self.title.text to get text, else title is text (from db generally)
        self.tab_title = None   # Generally same as title, but may be different
        self.body = None  # As original doc with title removed
        self.page_date = None
        self.db_exec = db_exec
        self.page_in_db = None
        self.page_manager = db_exec.create_page_manager()
        # TODO: Remove dependence on access to session (seems only needed for page caching)
        self.session = db_exec.get_db_session()

    def load_from_db(self, page_id=None, page_name=None):
        target_page = self.page_manager.fetch_page(page_id, page_name)
        self.page_in_db = target_page
        content = target_page.fetch_content(self.session)
        xhtml = etree.Element(XHTML + "html", nsmap=NSMAP)  # set namespaces so they don't appear in result HTML
        body = etree.SubElement(xhtml, XHTML + "body")


        self.title = target_page.page_title
        self.tab_title = self.title
        self.page_date = target_page.page_date

        if target_page.page_cached:
            new_body = hp.fromstring(content)
            # el = etree.Element(XHTML + 'div', nsmap=NSMAP)
            # el.text = content
            for item in new_body.getchildren():
                body.append(item)
            self.body = body
        else:
            body.append(self.normalize_page(target_page))
            self.body = body
            self.update_cached_page()

    @staticmethod
    def normalize_page(target_page):
        """Convert page to a standard form etree.

            A normalized page has:
                (1) line breaks either removed or converted to <br/> elements.
                (2) Any node containing both text and children to one with no text
                    where the text is embedded in a <span> element as first child. (this
                    facilitates shortcode handling).

            returns: etree div element with all content as children

        A fragment is an element and/or string (generally element).   An element may contain text which occurs
        inside the element tags.  It also may contain a tail which is text that occurs after the closing
        tag, but before the next element.  For elements with a tail, we add a new span element that is a parent
        of both the element (with tail removed) and a sibling span element containing the tail.
        """
        body = etree.Element(XHTML + "div", nsmap=NSMAP)
        # remove line breaks immediately following an element tag
        el_rep = target_page.page_content.replace('>\n', '>')
        body_list = hp.fragments_fromstring(el_rep)
        for el in body_list:
            if type(el) is str:
                enclose_span = etree.Element(XHTML + "span", nsmap=NSMAP)
                enclose_span.text = el
                body.append(enclose_span)
            else:
                body.append(el)
        # Note this fundamentally depends on side-effects - the parent node has its children modified appropriately
        PageBody._normalize_remove_children_tails(body)
        PageBody._covert_element_with_text(body)
        PageBody._break_strings(body)
        # foo = tostring(body, 'utf-8').decode('utf-8').replace('<html:', '<').replace('/html:', '/')
        return body

    @staticmethod
    def _normalize_remove_children_tails(el: etree.Element) -> None:
        """Create new children element list with none having a tail."""
        if not len(el):
            return
        children = [x for x in el.getchildren()]
        new_children_list = []
        for child in children:
            new_children_list += PageBody._covert_element_with_tail(child)
        for x in children:
            el.remove(x)
        for x in new_children_list:
            el.append(x)

    @staticmethod
    def _covert_element_with_tail(el: etree.Element) -> [etree.Element, etree.Element]:
        """Make tail into span node and remove it from element, returning both"""
        enclose_span = etree.Element(XHTML + "span", nsmap=NSMAP)
        enclose_span.text = el.tail
        el.tail = ''
        return [el, enclose_span]

    @staticmethod
    def _covert_element_with_text(el: etree.Element) -> None:
        """Convert an element with text to a child of a span."""
        if not len(el):
            return
        if not el.text:
            return
        if el.tag == 'span':
            return
        enclose_span = etree.Element(XHTML + "span", nsmap=NSMAP)
        enclose_span.text = el.text
        el.insert(0, enclose_span)
        el.text = ''

    @staticmethod
    def _break_strings(el: etree.Element) -> None:
        """Break any strings containing latex elements into separate children, replacing text."""
        if len(el):
            children = [x for x in el.getchildren()]
            for x in children:
                PageBody._break_strings(x)
            return
        if el.text:
            el_break = PageBody._break_text_string(el.text)
            for x in el_break:
                if x.text:
                    el.append(x)
            el.text = ''
            return

    @staticmethod
    def _break_text_string(text_string):
        """Convert text string to list of <p> elements."""
        ts1 = re.sub('[ \t]+', ' ', text_string)        # Replace tabs
        ts2 = re.sub('\n ', '\n', ts1)                  # Replace space following line feed
        ts3 = re.sub('\n(\n)+', '\n', ts2)              # Replace multiple line feeds with single one
        tsl = ts3.split('\n')                           # Break text into separate lines
        res = []
        for segment in tsl:
            el = etree.Element(XHTML + 'p', nsmap=NSMAP)
            el.text = segment
            res.append(el)
        return res

    @staticmethod
    def create_empty_element(tag):
        return etree.Element(XHTML + tag, nsmap=NSMAP)

    def update_cached_page(self):
        if self.page_in_db:
            res = tostring(self.body, 'utf-8').decode('utf-8').replace('<html:', '<').replace('/html:', '/')
            self.page_manager.update_cached_page(self.page_in_db, res)

    def find_title(self):
        """Find title from the body, if it exists.

        The title is assumed to be the first occurring element with an h* tag beginning with
        h1 and going to lower hx tags through level h4."""
        # TODO: Need to deal with body as soup and take from body
        title = None
        for elem in self.doc_as_html:
            if elem.tag.partition('}')[2] in ['h1', 'h2', 'h3', 'h4']:    # TODO: Need to remove namespace
                self.title = elem
                title = elem.text
                break
        return title

    def set_body(self):
        """Find body portion of html"""
        # TODO: Need to deal with body as soup
        if not self.title:
            self.find_title()
        self.body = self.doc_as_html  # We assume there is no outside copy/dependence on self.doc_as_html
        self.doc_as_html = copy.deepcopy(self.body)
        if self.title is not None:
            self.body.remove(self.title)

    def find_shortcodes(self):
        """Create a generator that will iterate through shortcodes.

        Returns:
            Yields tuple of (shortcode, element containing sc, start, end locations)
        """
        finder = r"\[{}(\s.*?)?\](?:([^\[]+)?\[\/{}\])?"
        sc_list = [re.compile(finder.format(x, x)) for x in Shortcode.available_shortcodes]
        if self.body is None:
            return None
        for elem in self.body.iter():
            el_str = elem.text
            if elem.text:
                for sc in sc_list:
                    # TODO: change back to finditer
                    # We must iterate without re.finditer because elem may change in subsequent processing
                    while True:
                        next_match = re.search(sc, elem.text)
                        if next_match is None or next_match.groups() is None:
                            break
                        start = next_match.start()
                        end = next_match.end()
                        yield sc, elem, start, end

    def get_title_body(self):
        if self.title and self.body is not None:                # body test is for lxml - expected future change
            return self.title, self.tab_title, self.body
        if not self.body:
            if self.doc_as_html:
                self.set_body()
            else:
                return None, None, None
        return self.title, self.title, self.body

    def create_snippet(self, max_length=125):
        if not self.body:
            _, tmp = self.get_title_body()
            if tmp is None:
                return None
        ct = stringify_children(self.body).replace('\n', '')
        if len(ct) > max_length:
            return ct[0:max_length]
        else:
            return ct


def stringify_children(node):
    if type(node) == str:
        return node
    else:
        nl = node.getchildren()
        if len(nl):
            nl2 = [stringify_children(x) for x in nl]
            return ''.join(nl2)
        else:
            return node.text


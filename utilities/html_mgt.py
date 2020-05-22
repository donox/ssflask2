from lxml.html import html5parser as hp
from lxml import etree
from xml.etree.ElementTree import tostring
import copy
import re
from utilities.shortcodes import Shortcode
from db_mgt.db_exec import DBExec

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
    def __init__(self, db_exec: DBExec):
        self.db_exec = db_exec
        self.doc_as_html = None  # Not set if page is loaded from database
        self.title = None  # If html element use self.title.text to get text, else title is text (from db generally)
        self.author = None
        self.snippet = None
        self.tab_title = None   # Generally same as title, but may be different
        self.body = None  # As original doc with title removed
        self.page_date = None
        self.db_exec = db_exec
        self.page_in_db = None
        self.page_manager = db_exec.create_page_manager()

    def load_from_db(self, page_id=None, page_name=None):
        target_page = self.page_manager.fetch_page(page_id, page_name)
        self.page_in_db = target_page
        content = target_page.fetch_content(self.db_exec)
        self.title, self.author, self.snippet = target_page.fetch_title_author_snippet()
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

    def normalize_page(self, target_page):
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
        self._normalize_remove_children_tails(body)
        self._convert_element_with_text(body)
        self._break_strings(body)
        # foo = tostring(body, 'utf-8').decode('utf-8').replace('<html:', '<').replace('/html:', '/')
        return body

    def _normalize_remove_children_tails(self, el: etree.Element) -> None:
        """Create new children element list with none having a tail."""
        if not len(el):
            return
        children = [x for x in el.getchildren()]
        for child in children:
            self._normalize_remove_children_tails(child)
        new_children_list = []
        for child in children:
            if child.tail:
                new_children_list += self._convert_element_with_tail(child)
            else:
                new_children_list.append(child)
        for x in children:
            el.remove(x)
        for x in new_children_list:
            el.append(x)

    def _convert_element_with_tail(self, el: etree.Element) -> [etree.Element, etree.Element]:
        """Make tail into span node and remove it from element, returning both

            This allows both the element and its new sibling to the right to be appended to the parent."""
        enclose_span = etree.Element(XHTML + "span", nsmap=NSMAP)
        enclose_span.text = el.tail
        el.tail = ''
        return [el, enclose_span]

    def _convert_element_with_text(self, el: etree.Element) -> None:
        """Convert an element with text to a child of a span.

            We wrap the text in a <span> and place it as the first child of the element."""
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

    def _break_strings(self, el: etree.Element) -> None:
        """Break any strings containing latex elements into separate children, replacing text."""
        try:
            if len(el):
                children = [x for x in el.getchildren()]
                for x in children:
                    self._break_strings(x)
                return
            if el.text:
                el_break = self._break_text_string(el.text)
                for x in el_break:
                    if x.text:
                        el.append(x)
                el.text = ''
                return
        except Exception as e:
            self.db_exec.add_error_to_form('Break Strings', f'Error in internal method on element {el}')


    def _break_text_string(self, text_string):
        """Convert text string containing new lines to list of <span> elements."""
        ts1 = re.sub('[ \t]+', ' ', text_string)        # Replace tabs
        ts2 = re.sub('\n ', '\n', ts1)                  # Replace space following line feed
        ts3 = re.sub('\n(\n)+', '\n', ts2)              # Replace multiple line feeds with single one
        tsl = ts3.split('\n')                           # Break text into separate lines
        res = []
        for segment in tsl:
            el = etree.Element(XHTML + 'span', nsmap=NSMAP)
            el.text = segment
            # the inner 'not's are converting the values to booleans so if el has content in one subelement,
            # the inner expression will evaluate false.
            if not (not el.getchildren() and not el.text and not el.tail):
                res.append(el)
        return res


    def create_empty_element(self, tag):
        return etree.Element(XHTML + tag, nsmap=NSMAP)

    def update_cached_page(self):
        if self.page_in_db:
            res = tostring(self.body, 'utf-8').decode('utf-8').replace('<html:', '<').replace('/html:', '/')
            self.page_manager.update_cached_page(self.page_in_db, res)

    def get_title_author_snippet(self):
        return self.title, self.author, self.snippet

    def set_body(self):
        """Find body portion of html"""
        # TODO: Need to deal with body as soup
        if not self.title:
            self.get_title_author_snippet()
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

    def get_story_body(self):
        if self.body is not None:                # body test is for lxml - expected future change
            return self.body
        else:
            if self.doc_as_html:
                self.set_body()
                return self.body
            else:
                return None

    def create_snippet(self, max_length=125):
        if self.snippet:
            return self.snippet
        # If there is not snippet specified in the story - take it from the body text
        if not self.body:
            tmp = self.get_story_body()
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


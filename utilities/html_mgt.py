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


class PageBody(object):
    """Utility operations to organize and structure the body of an html page.
    """
    def __init__(self, session):
        # TODO: set directories via config
        self.working_dir = '/home/don/devel/flaskSamples/'
        self.doc_as_html = None  # Not set if page is loaded from database
        self.title = None  # If html element use self.title.text to get text, else title is text (from db generally)
        self.tab_title = None   # Generally same as title, but may be different
        self.body = None  # As original doc with title removed
        self.page_date = None
        self.session = session
        self.page_in_db = None

    def _dummy_result_page(self, page_id, page_name):
        """Dummy page for failing retrieve."""
        result = Page()
        result.page_title = 'Page Not Found: {}'.format(page_name)
        result.page_content = '''<p>Fail when loading page with id/name: {}/{}</p>'''.format(page_id, page_name)
        return result

    def _fetch_page(self, page_id, page_name):
        """Fetch page from database, using cached page if it exists and is current."""
        try:
            if page_id:
                target_page = self.session.query(Page).filter(Page.id == page_id).first()
            elif page_name:
                target_page = self.session.query(Page).filter(Page.page_name == page_name.lower()).first()
            else:
                raise SiteIdentifierError(None, None, 'No id or page_name provided')
            if target_page:
                self.page_in_db = target_page
                return target_page
            else:
                raise SiteObjectNotFoundError(page_id, page_name, 'DB returned null result')
        except Exception as e:
            print(e.args)
        finally:
            target_page = self._dummy_result_page(page_id, page_name)
        return target_page

    def load_from_db(self, page_id=None, page_name=None):
        target_page = self._fetch_page(page_id, page_name)
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
                    facilitates shortcode handling.

            returns: etree div element with all content as children
        """
        # Replace line breaks  (1) remove those separating elements.
        #                      (2)??needed? replace 2 consecutive breaks with one as that creates more space than wanted.
        #                      (3)?? needed? replace single breaks as break.
        body = etree.Element(XHTML + "div", nsmap=NSMAP)
        # remove line breaks immediately following an element tag
        el_rep = target_page.page_content.replace('>\n', '>')
        body_list = hp.fragments_fromstring(el_rep)
        # A fragment is an element and/or string (generally element).   An element may contain text which occurs
        # inside the element tags.  It also may contain a tail which is text that occurs after the closing
        # tag, but before the next element.   We remove all tails adding a new span element enclosing the tail
        # string.  We also enclose non-empty strings in span element
        for el in body_list:
            if type(el) is str:
                if el != '':
                    res = PageBody._break_text_string(el)
                    for elnew in res:
                        body.append(elnew)
            elif el.text:
                res = PageBody._break_text_string(el.text)
                el.text = ''
                res.reverse()
                for elnew in res:
                    el.insert(0, elnew)
                body.append(el)
            elif el.tail:
                res = PageBody._break_text_string(el.tail)
                el.tail = ''
                for elnew in res:
                    el.append(elnew)
                body.append(el)
            else:
                body.append(el)
        # foo = tostring(body, 'utf-8').decode('utf-8').replace('<html:', '<').replace('/html:', '/')
        return body

    @staticmethod
    def _break_text_string(text_string):
        """Convert text string to list of strings with <br> separators."""
        ts1 = re.sub('[ \t]+', ' ', text_string)
        ts2 = re.sub('\n ', '\n', ts1)
        ts3 = re.sub('\n(\n)+', '\n', ts2)
        tsl = ts3.split('\n')
        res = []
        for segment in tsl:
            el = etree.Element(XHTML + 'span', nsmap=NSMAP)
            el.text = segment
            res.append(el)
        return res

    @staticmethod
    def create_empty_element(tag):
        return etree.Element(XHTML + tag, nsmap=NSMAP)

    def update_cached_page(self):
        if self.page_in_db:
            res = tostring(self.body, 'utf-8').decode('utf-8').replace('<html:', '<').replace('/html:', '/')
            self.page_in_db.update_cache(self.session, res)

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


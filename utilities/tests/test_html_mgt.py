from test_base import BaseTestCase
from db_mgt.db_exec import DBExec
from db_mgt.page_tables import Page
from utilities.html_mgt import PageBody
from lxml.html import html5parser as hp
from lxml import etree
import lxml
from xml.etree.ElementTree import tostring
from utilities.shortcodes import Shortcode
import re

XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
XHTML = "{%s}" % XHTML_NAMESPACE
NSMAP = {None: XHTML_NAMESPACE}

class TestHtmlMgt(BaseTestCase):

    def setUp(self):
        self.db_exec = DBExec()
        self.el_rep = """<div xmlns:html="http://www.w3.org/1999/xhtml">
    <div class="srcActivity">
        <h2 class="srcHeading"><span>Purpose</span></h2>
        <div class="srcBodySection"><span>The woodworking shop, located on the ground floor of the Highlands, is a well-equipped shop waiting for you and your project. On-going solo and group projects include flag cases for families of deceased veterans, and doll cradles for the Salvation Army Christmas dolls.</span>
        </div>
        [singlepic id="3944"]
        <h2 class="srcHeading"><span>Activities</span></h2>
        <div class="srcBodySection"><span>This is an example of a flag case which Sunnyside veterans make and give to the family of a deceased veteran.</span>
        </div>
        [singlepic id="122"]work in process
        <h2 class="srcHeading"><span>Meetings</span></h2>
        <div class="srcBodySection"><span>There are no scheduled meetings</span></div>
        <h2 class="srcHeading"><span>Contact or More Information</span></h2>
        <div class="srcBodySection"><span>Len Tulio, 540-568-8365, dale2leo@gmail.com</span></div>
        [singlepic id="3962" w="400" float="left"]
        [singlepic id="3945" w="400" float="center"]
        [singlepic id="3946" w="400" float="right"]
        [singlepic id="3947" w="400" float="center"]
        [singlepic id="120" w="400" float="left"]
        [singlepic id="121" w="400" float="left"]

    </div>
    <span/></div>"""
        self.body = etree.Element(XHTML + "div", nsmap=NSMAP)
        self.body_list = [x for x in hp.fragments_fromstring(self.el_rep)]

        self.el_rep2 = """<div xmlns:html="http://www.w3.org/1999/xhtml">
        <div class="srcActivity">
            <h2>xxx</h2>
            [singlepic id="3944"]</div"""

    def test_remove_tails(self):
        try:
            pb = PageBody(self.db_exec)
            target_page = Page()
            target_page.page_content = self.el_rep
            res = pb.normalize_page(target_page)
            html = tostring(res, 'utf-8').decode('utf-8').replace('<html:', '<').replace('/html:', '/')
            foo = 3
        except Exception as e:
            foo = 3

    def test_find_pics_in_page(self):
        page_slugs = [('did-you-know', 3), ('bear-winner2', 2)]
        for try_page, pic_count in page_slugs:
            pb = PageBody(self.db_exec)
            ids = pb.find_photo_ids_in_page(None, try_page)
            self.assertEqual(len(ids), pic_count, "Did not find right number of photos")

    def test_shortcode_re(self):
        ngg = '[ngg_images source="galleries" container_ids="68" display_type="photocrati-nextgen_basic_slideshow" gallery_width="300" gallery_height="200" cycle_effect="fade" cycle_interval="10" show_thumbnail_link="0" thumbnail_link_text="Show thumbnails" ngg_triggers_display="never" order_by="imagedate" order_direction="ASC" returns="included" maximum_entity_count="500"]The swing that Stan'
        matches = re.search(Shortcode.sc_re, ngg)
        for n, match in enumerate(matches.groups()):
            if n == 1:
                self.assertEqual(len(match), 349, "Did not complete full match")


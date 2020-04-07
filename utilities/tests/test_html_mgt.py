from test_base import BaseTestCase
from db_mgt.db_exec import DBExec
from utilities.html_mgt import PageBody
from lxml.html import html5parser as hp
from lxml import etree
import lxml
from xml.etree.ElementTree import tostring

XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
XHTML = "{%s}" % XHTML_NAMESPACE
NSMAP = {None: XHTML_NAMESPACE}

class TestHtmlMgt(BaseTestCase):

    def setUp(self):
        self.el_rep = """&nbsp;
<div class="srcActivity">
<h2 class="srcHeading">Purpose</h2>
<div class="srcBodySection">Sunnyside is a wonderful place for unique photography opportunities,
and a number of our residents are avid camera enthusiasts!</div>
[singlepic id="304" w="300" float="right"]
[singlepic id="762" w="300" float="left"]
</div>
</div>
<h2 class="srcHeading">Activities</h2>
<div class="srcBodySection">If you have questions about composition, camera settings, photo editing, printing, or 
sharing - or just want to talk with other "shutterbugs", here are   residents you might want to get to know:
<ol>
<ul>
Linda Bradley, 540-568-8663
</ul>
<ul>

Mary Rouse, 540-246-6363 or Photos@SunnysideTimes.com
</ul>
<ul>


Feel free to call us to set up a photo walk or drive to share and shoot our wonderful world.

Each of these residents belongs to <strong>Rocktown Camera Club</strong>, a local photography group that meets at Trinity Presbyterian Church at 7:30 p.m. on the fourth Monday of each month from September-November and January-June. The club welcomes photographers of all levels and holds a variety of inspiring programs and other photography activities. <a href="https://rocktowncameraclub.blogspot.com/">Click here</a> to find out more about the Rocktown Camera Club. We car pool to the meetings and would welcome you to come along!


</div>
<h2 class="srcHeading">Meetings</h2>
<div class="srcBodySection">We are an informal group and don't have any structured organization or meetings on campus.</div>
<h2 class="srcHeading">Contact or More Information</h2>
<div class="srcBodySection">For more information, contact Linda Bradley at bradlelm@jmu.edu or 540- 568-8663.</div>"""
        self.body = etree.Element(XHTML + "div", nsmap=NSMAP)
        self.body_list = [x for x in hp.fragments_fromstring(self.el_rep)]

    def process_element(self, bl):
        for el in bl:
            if type(el) is str:
                x = etree.Element(XHTML + "span", nsmap=NSMAP)
                x.text = el
                self.body.append(x)
            elif type(el) == etree.Element:
                for x in PageBody._normalize_help(el):
                    self.body.append(x)
        foo = PageBody._normalize_help_2(self.body)
        return foo

    def test_one(self):
        bl = self.body_list[0]
        self.process_element(bl)
        self.assertEqual(2, len(list(self.body)),  "Wrong number of elements returned")
        self.assertEqual('span', list(self.body)[0].tag[-4:],  "Incorrect Tag returned")

    def test_two(self):
        bl = self.body_list[2]
        res = PageBody._normalize_help(bl)
        self.assertEqual(['Activities', '\n'], [x for x in res[0].itertext()],  "Wrong Result")

    def test_three(self):
        res = []
        for bl in self.body_list:
            foo = PageBody._normalize_help(bl)
            bar = [x for x in foo[0].itertext()]
            res += bar
        self.assertEqual(28, len(res), 'Wrong number of elements returned')

    def test_four(self):
        res = []
        for bl in self.body_list:
            foo = PageBody._normalize_help(bl)
            bar = [x for x in foo[0].iter()]
            res += bar
        for x in res:
            self.body.append(x)
        PageBody._normalize_help_2(self.body)
        self.assertEqual(42, len(self.body), 'Wrong number of elements returned')



from test_base import BaseTestCase
from ssfl.admin.manage_events.event_operations import CsvToDb
from io import StringIO
import csv


class TestDBManageCalendarForm(BaseTestCase):
    def test_validate_on_submit(self):
        foo = 3
        self.assertTrue(True)


class TestCalendarImport(BaseTestCase):
    def test_sanitize_csv(self):
        def _test_csv(row, test_res):
            f = StringIO(row)
            reader = csv.reader(f)
            for rowx in reader:
                res = CsvToDb._sanitize_row(rowx)
                self.assertTrue(res[0] == test_res)
                for col in res[1]:
                    self.assertTrue(all(ord(char) < 128 for char in col))
        row1 = r'''Trip: Youll Never Look at Election News the Same Way Again Presentation *","Curious about the 2020 elections, but not sure where to start? Interested if that article your friend just posted on social media is true? Come hear strategies for evaluating election news. JMU professor and local journalist, Ryan Alessi, will run a non-partisan workshop that will teach you skills you can use to become an expert.","Event","Massanutten Regional Library","IL, AL",,0,"* Sign up required. Call 8200/8201 or 8241","EC Pickup: 6:05pm","HL Pickup: 6:15pm",12/30/1899 18:05:00,12/30/1899 21:00:00,2/17/2020 0:00:00,,,,,,,,,,,,,,,,,,,,,,,'''
        row2 = r'''"Trip: BHS Musical: Willy Wonka & the Chocolate Factory *","A sweet boy from a poor family dreams of finding one of five golden tickets hidden inside chocolate bar wrappers which will admit him to the eccentric and reclusive Willy Wonka's magical factory. One after another, tickets are discovered by ghastly children - but will the lad find the last remaining one and have all his dreams come true? Based on Roald Dahls book Charlie & the Chocolate Factory, Willy Wonka is a scrumdidilyumptious musical guaranteed to delight everyone's sweet tooth. Please note, at the time of press, tickets were not yet available. Tickets will be between $10 and $15 per ticket. Approximate return: 6 pm","Event","Broadway High School","IL, AL","$10-$15/ticket",0,"* Sign up required. Call 8200/8201 or 8241","EC Pickup: 1:50pm","HL Pickup: 2pm",12/30/1899 13:50:00,12/30/1899 18:00:00,2/23/2020 0:00:00,,,,,,,,,,,,,,,,,,,,,,,'''
        row3 = r'''"Your Medicine Cabinet: Whats There, What Isnt and Why Presentation","Presented by Dr. Sara H. Fitzgerald Associate Professor of Chemistry, Bridgewater College
This session offers a closer look at the drug discovery process, from the historical influences to the scientific breakthroughs to the ethical dilemmas. To be informed consumers and, perhaps more importantly, to be cognizant patients, the devil is in the details. Sara H. Fitzgerald received a B.S. in chemistry from Bridgewater College and a Ph.D. in chemistry from the University of Virginia.","Event","Bethesda Theatre - Eiland Center","IL, AL",,0,,,,12/30/1899 14:45:00,12/30/1899 15:45:00,2/26/2020 0:00:00,,,,,,,,,,,,,,,,,,,,,,,'''
        row4 = r'''"Furniture Sale",,"Resident Clubs","Bistro Basement","IL, AL",,0,,,,12/30/1899 9:00:00,12/30/1899 12:00:00,2/1/2020 0:00:00,,,,,,,,,,,,,,,,,,,,,,,'''
        _test_csv(row1, True)
        _test_csv(row2, True)
        _test_csv(row3, True)
        _test_csv(row4, True)

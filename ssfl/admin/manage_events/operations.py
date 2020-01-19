from db_mgt.event_tables import Event, EventMeta, EventTime, event_meta_tbl
import csv
import datetime as dt

# These are needed when running standalone
from pathlib import Path
from dotenv import load_dotenv
env_path = '/home/don/devel/ssflask2/.env'
load_dotenv(dotenv_path=env_path)
import db_mgt.setup as su

# Fields by number for a Calendar csv file row
CAL_EVENT_NAME = 0
CAL_DESCRIPTION = 1
CAL_CATEGORIES = 2
CAL_LOCATION = 3
CAL_AUDIENCE = 4
CAL_COST = 5
CAL_ALL_DAY = 6
CAL_SIGN_UP = 7
CAL_EC = 8
CAL_HL = 9
CAL_START = 10
CAL_END = 11
CAL_DATES_BEGIN = 12

# TODO: Need to check if an event is a duplicate which can mean the base event is duplicated but has
#       a different audience or category.  Issue:  if there is a different category or audience are they
#       full replacements or we add the deltas and have separate removal means

class CalendarEvent(object):
    """A CalendarEvent object is a temporary layer between outside info and the DB."""
    def __init__(self):
        self.name = ''
        self.description = ''
        self.venue = ''
        self.all_day = False  # True for all day event
        self.occurs = []  # list of tuple of start, end times, date
        self.audience = []
        self.categories = []
        self.cost = ''
        self.sign_up = ''
        self.ec_depart = ''
        self.hl_depart = ''

    def print(self, preamble=None):
        print('{}:{}'.format(self.name, preamble))
        print('  {}'.format(self.description))
        print('  Venue: {}; Cost: {}'.format(self.venue, self.cost))
        print('  Categories: {}'.format(self.categories))
        print('  Audience: {}'.format(self.audience))
        print('  Is All Day: {}'.format(self.all_day))
        print('  SignUp Req: {}'.format(self.sign_up))
        print('  Pickup: EC: {} - HL: {}'.format(self.ec_depart, self.hl_depart))
        for ev_start, ev_end, ev_date in self.occurs:
            print('    Date: {}; Start: {}; End: {}'.format(ev_start, ev_end, ev_date))

    def add_to_db(self, db_session):
        """Add event(s) to database represented by this event, if not already there."""
        # TODO: Verify that it is not already there.
        # Get Venue if it exists or add it, if not.
        if self.venue:
            res = db_session.query(EventMeta).filter(EventMeta.meta_key == 'location').\
                filter(EventMeta.meta_value == self.venue).all()
            if res:
                self.venue = res[0]
            else:
                loc = self.venue
                self.venue = EventMeta()
                self.venue.meta_key = 'location'
                self.venue.meta_value = loc
                self.venue.add_to_db(db_session, commit=True)
        else:
            self.venue = None
        audience_list = [x.upper() for x in self.audience]
        res = db_session.query(EventMeta).\
            filter(EventMeta.meta_key == 'audience').filter(EventMeta.meta_value.in_(audience_list)).all()
        if not res:
            raise ValueError("Can't find audience")
        else:
            audiences = res
        res = db_session.query(EventMeta). \
            filter(EventMeta.meta_key == 'category').filter(EventMeta.meta_value.in_(self.categories)).all()
        if not res:
            raise ValueError("Can't find category")
        else:
            self.categories = res
        if self.venue:
            venue_id = self.venue
        else:
            venue_id = None
        db_event = Event(event_name=self.name, event_description=self.description,
                         event_cost=self.cost, event_sign_up=self.sign_up, event_EC_pickup=self.ec_depart,
                         event_HL_pick_up=self.hl_depart)
        db_event.add_to_db(db_session, commit=True)
        if self.venue:
            db_event.event_to_meta.append(self.venue)
        for item in audiences:
            db_event.event_to_meta.append(item)
            item.events.append(db_event)
        for item in self.categories:
            db_event.event_to_meta.append(item)
            item.events.append(db_event)
        for time in self.occurs:
            if self.all_day > '0':
                ad = True
            else:
                ad = False
            if time[0]:
                st = dt.datetime.combine(time[2], time[0])
            else:
                st = time[2]
            if time[1]:
                end = dt.datetime.combine(time[2], time[1])
            else:
                end = time[2]
            new_time = EventTime(all_day_event=ad, start=st, end=end, event_id=db_event.id)
            new_time.add_to_db(db_session)
        db_session.commit()


class CsvToDb(object):
    def __init__(self, csv_file):
        self.csv_file = csv_file
        self.events = None

    def read_file(self):
        with open(self.csv_file, 'r', encoding='utf-8', errors='ignore') as fl:
            rdr = csv.reader(fl)
            for row in rdr:
                yield row

    def check_event_exists(self, event_name, audience, time):
        """Check if this event already exists which means it has the same name, audience, and time."""
        return False

    @staticmethod
    def _try_parsing_time(text):
        if not text:
            return None
        for fmt in ('%m/%d/%Y %H:%M:%S', '%H:%M', '%H:%M:%S', '%H:%M:%S %p'):
            try:
                return dt.datetime.strptime(text, fmt).time()
            except ValueError:
                pass
        raise ValueError('No valid format found to parse {}'.format(text))

    @staticmethod
    def _try_parsing_date(text):
        for fmt in ('%m/%d/%Y %H:%M:%S',):
            try:
                return dt.datetime.strptime(text, fmt).date()
            except ValueError:
                pass
        raise ValueError('No valid format found to parse {}'.format(text))

    def add_events(self):
        """Add events in csv file to DB."""
        event_list = []
        for row in self.read_file():
            new_event = CalendarEvent()
            new_event.name = row[CAL_EVENT_NAME]
            new_event.venue = row[CAL_LOCATION]
            dl = [CsvToDb._try_parsing_date(x) for x in row[CAL_DATES_BEGIN:] if x]
            st = CsvToDb._try_parsing_time(row[CAL_START])
            nd = CsvToDb._try_parsing_time(row[CAL_END])
            new_event.occurs = [(st, nd, x) for x in dl]
            new_event.all_day = row[CAL_ALL_DAY]
            new_event.description = row[CAL_DESCRIPTION]
            cat_list = []
            if row[CAL_CATEGORIES]:
                cat_list = [x.lower().strip() for x in row[CAL_CATEGORIES].split(',')]
            new_event.categories = cat_list
            new_event.audience = [x.upper().strip() for x in row[CAL_AUDIENCE].lower().split(',')]
            new_event.cost = row[CAL_COST]
            new_event.sign_up = row[CAL_SIGN_UP]
            new_event.ec_depart = row[CAL_EC]
            new_event.hl_depart = row[CAL_HL]
            event_list.append(new_event)
        self.events = event_list

    def get_event_list(self):
        return self.events


if __name__ == '__main__':
    df = '/home/don/devel/nightly-scripts/worktemp/calendars/JanuaryCalendar.csv'
    engine = su.get_engine()
    session = su.create_session(engine)
    tables = su.create_tables(engine)
    build_calendar = CsvToDb(df)
    build_calendar.add_events()
    for evt in build_calendar.get_event_list():
        evt.add_to_db(session)

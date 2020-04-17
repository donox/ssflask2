from db_mgt.event_tables import Event, EventMeta, EventTime, event_meta_tbl, calendar_categories, calendar_audiences
import csv
import datetime as dt
from ssfl import sst_syslog
from unidecode import unidecode
from io import StringIO
import json
from db_mgt.base_table_manager import BaseTableManager

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

class CalendarEventManager(BaseTableManager):
    def __init__(self, db_session):
        super().__init__(db_session)
        self.db_session = db_session

    def add_event_to_database(self, event, commit=True):
        event.add_to_db(self.db_session, commit=True)

    def get_new_calendar_event(self):
        event = CalendarEvent()
        return event

class CalendarEvent(object):
    """A CalendarEvent object is a temporary layer between outside info and the DB.

    This needs to be reduced to a method within the Event manager to determine if it is appropriate to
    to add an event (is it duplicated)."""
    zero_time = dt.time(hour=0, minute=0, second=0)

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

    def add_to_db(self, db_session, commit=True):
        """Add event(s) to database represented by this event, if not already there."""
        already_there = self._check_if_there(db_session, check_location=True, check_time=True)
        if 'location' not in already_there.keys():


            # Get Venue if it exists or add it, if not.
            if self.venue:
                res = db_session.query(EventMeta).filter(EventMeta.meta_key == 'location'). \
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
        else:
            self.venue = already_there['location']

        audience_list = [x.upper() for x in self.audience]  # Make sure of capitalization

        res = db_session.query(EventMeta).filter(EventMeta.meta_key ==
                                                 'audience').filter(EventMeta.meta_value.in_(audience_list)).all()
        if not res:
            raise ValueError("Can't find audience")
        else:
            audiences = res
        res = db_session.query(EventMeta).filter(EventMeta.meta_key ==
                                                 'category').filter(EventMeta.meta_value.in_(self.categories)).all()
        if not res:
            raise ValueError("Can't find category")
        else:
            self.categories = res

        if self.venue:
            venue_id = self.venue
        else:
            venue_id = None

        if 'event' not in already_there.keys():
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
            db_event_id = db_event.id
        else:
            db_event_id = already_there['event']

        for time in self.occurs:
            val = self.all_day
            if type(val) is bool:
                pass
            elif type(val) is str:
                if val == '0':
                    val = False
                else:
                    val = True
            elif type(val) is int:
                if val <= 0:
                    val = False
                else:
                    val = True
            if val:
                ad = True
            else:
                ad = False
            if time[0]:
                tm = time[0]
            else:
                tm = CalendarEvent.zero_time
            st = dt.datetime.combine(time[2], tm)  # Ensure there is a time component to match DB retrieval
            if time[1]:
                tm = time[1]
            else:
                tm = CalendarEvent.zero_time
            end = dt.datetime.combine(time[2], tm)
            found_it = False
            if 'time' in already_there.keys():
                for id, all_day, a_st, a_end in already_there['time']:
                    if st == a_st and end == a_end:
                        found_it = True
            if not found_it:
                new_time = EventTime(all_day_event=ad, start=st, end=end, event_id=db_event_id)
                new_time.add_to_db(db_session)
        if commit:                  # Should not do commit here
            db_session.commit()

    def _check_if_there(self, db_session, check_time=False, check_location=False):
        # TODO: Handle All Day Event
        """Determine if a potential new event already exists in the database.

        Audiences and categories are assumed to be present (new ones need to be added behind the scenes).
        If either check_time or check_location is True, then an event is considered not there if either is
        missing.  If both are False, then an event is missing if any base field differs.
        """
        sql = 'select id, event_name as name, event_description as description, '
        sql += 'event_cost as cost, event_sign_up as sign_up, event_EC_pickup as ec_pickup, '
        sql += 'event_HL_pick_up as hl_pickup from event '
        sql += 'where '
        sql += 'event_name = \'{}\' and event_cost = \'{}\' '
        sql += 'and event_sign_up = \'{}\' and event_EC_pickup = \'{}\' '
        sql += 'and event_HL_pick_up = \'{}\' ;'

        sql_meta = 'select id from event_meta as em '
        sql_meta += 'join event_meta_tbl as emt where '
        sql_meta += 'em.id = emt.meta_id and em.id = emt.event_id '
        sql_meta += 'and em.meta_key = \'location\' '
        sql_meta += 'and em.meta_value = \'{}\';'

        sql_time = 'select id, all_day_event, start, end from event_time '
        sql_time += 'where event_id = {} '
        sql_time2 = 'and start = \'{}\' and end = \'{}\'; '

        elements_found = {}
        name = self.name.replace("'", "''")  # MySQL escape single quote chars
        full_sql = sql.format(name, self.cost, self.sign_up, self.ec_depart, self.hl_depart)
        res = db_session.execute(full_sql).first()
        if not res:
            return elements_found
        e_id = res[0]
        elements_found['event'] = e_id
        if check_location:
            if self.venue != '':
                meta_sql = sql_meta.format(self.venue)
                res = db_session.execute(meta_sql).first()
                if res:
                    elements_found['location'] = res.first()
        if check_time:
            # TODO: Handle ALL DAY event
            first_time = True
            for ev_start, ev_end, ev_date in self.occurs:
                time_sql_base = sql_time.format(e_id)
                st = CalendarEvent.combine_date_time_to_str(ev_start, ev_date)
                nd = CalendarEvent.combine_date_time_to_str(ev_end, ev_date)
                time_sql = time_sql_base + sql_time2.format(st, nd)
                res = db_session.execute(time_sql).first()
                if res:
                    if first_time:
                        elements_found['time'] = [res]
                        first_time = False
                    else:
                        elements_found['time'].append(res)
        return elements_found

    @staticmethod
    def combine_date_time_to_str(time: dt.time, date: dt.date):
        if time:
            return dt.datetime.combine(date, time).strftime('%Y-%m-%d %H:%M:%S')
        else:
            return dt.datetime.strftime(date, '%Y-%m-%d') + ' 00:00:00'


class JSONToDb(object):
    def __init__(self, db_exec, json_file):
        self.db_exec = db_exec
        self.cal_mgr = self.db_exec.create_calendar_manager()
        self.json_file = json_file
        self.events = None

    def read_file(self):
        f = json.loads(self.json_file)
        rdr = f["Community"]
        for row in rdr:
            yield row

    @staticmethod
    def _try_parsing_time(text):
        if not text:
            return None
        for fmt in ('%m/%d/%Y %H:%M:%S', '%H:%M', '%H:%M %p', '%H:%M%p', '%H:%M:%S', '%H:%M:%S %p'):
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
    # "month": "March",
    # "days": "7",
    # "location": "Fishersville",
    # "desc"

    @staticmethod
    def _get_list_of_days(year: int, mth: str, days: str):
        months = [dt.date(year, i, 1).strftime('%B') for i in range(1, 13)]
        this_month = months.index(mth) + 1
        if days == '':
            return None
        day_list = days.split(',')
        res = []
        for day_str in day_list:
            day_range = day_str.split('-')
            if len(day_range) == 1:
                res.append(dt.date(year, this_month, int(day_range[0])))
            else:
                for i in range(int(day_range[0]), int(day_range[1])+1):
                    res.append(dt.date(year, this_month, i))
        return res

    def add_events(self):
        """Create list of all events in JSON file."""
        # TODO:  Need to complete when source file is updated (days, categories, audiences, name, ...)
        event_list = []
        try:
            for row in self.read_file():
                new_event = self.cal_mgr.get_new_calendar_event()
                new_event.name = row['event_name']
                new_event.venue = row['event_location']
                # dl = [CsvToDb._try_parsing_date(x) for x in row[CAL_DATES_BEGIN:] if x]
                days = row['days']
                mth = row['month']
                year = int(dt.datetime.now().year)
                dl = JSONToDb._get_list_of_days(year, mth, days)
                st = JSONToDb._try_parsing_time('7:30PM')
                nd = JSONToDb._try_parsing_time('9:30PM')
                new_event.occurs = [(st, nd, x) for x in dl]
                if row['all_day'] == '':
                    new_event.all_day = False
                else:
                    new_event.all_day = True
                new_event.description = row['event_description']
                cat_list = ['Event']
                new_event.categories = cat_list
                new_event.audience = ['IL']
                new_event.cost = row['event_cost']
                new_event.sign_up = ''
                new_event.ec_depart = ''
                new_event.hl_depart = ''
                event_list.append(new_event)
            self.events = event_list
        except Exception as e:
            foo = 3
            raise e

    def get_event_list(self):
        return self.events

class CsvToDb(object):
    def __init__(self, db_exec, csv_file):
        self.db_exec = db_exec
        self.cal_mgr = self.db_exec.create_calendar_manager()
        self.csv_file = csv_file
        self.events = None

    def read_file(self):
        f = StringIO(self.csv_file)
        rdr = csv.reader(f)
        for row in rdr:
            valid, new_row = CsvToDb._sanitize_row(row)
            if valid:
                yield new_row
            # else:
            #     raise ValueError(row)

    @staticmethod
    def _sanitize_row(row):
        success = True
        if row[CAL_CATEGORIES] == '' or row[CAL_AUDIENCE] == '':
            success = False
            return success, row
        categories = row[CAL_CATEGORIES].split(',')
        for cat in categories:                      # This is primarily defending against problems in
            if cat not in calendar_categories:      # earlier columns that cause errors in the csv file
                success = False
                return success, row
        row[CAL_EVENT_NAME] = unidecode(row[CAL_EVENT_NAME])
        row[CAL_DESCRIPTION] = unidecode(row[CAL_DESCRIPTION])
        return success, row

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
        """Create list of all events in CSV file."""
        event_list = []
        try:
            for row in self.read_file():
                new_event = self.cal_mgr.get_new_calendar_event()
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
        except Exception as e:
            foo = 3
            raise e

    def get_event_list(self):
        return self.events


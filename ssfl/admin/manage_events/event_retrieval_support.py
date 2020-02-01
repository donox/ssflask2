from db_mgt.event_tables import Event, EventMeta, EventTime, event_meta_tbl
import csv
import datetime as dt
from time import mktime
import random

# These are needed when running standalone
from pathlib import Path
from dotenv import load_dotenv

env_path = '/home/don/devel/ssflask2/.env'
load_dotenv(dotenv_path=env_path)
import db_mgt.setup as su


def get_random_events(db_session, count):
    all = db_session.query(Event.id).all()
    events_to_return = []
    nbr_events = len(all)
    for i_cnt in range(count):
        events_to_return.append(all[random.randint(0, nbr_events - 1)].id)
    res = db_session.query(Event).filter(Event.id.in_(events_to_return)).all()
    return res


def quotify(x):
    return "'" + x + "'"


class Evt(object):
    """Intermediate Event object to handle SQL result that is not proper SQLAlchemy object"""

    # TODO: Add Location
    def __init__(self, id, event_name, event_description, event_cost, event_sign_up, hl_pick_up, ec_pickup,
                 all_day, event_start, event_end, event_location, event_audiences, event_categories):
        self.id = id
        self.event_name = event_name
        self.event_description = event_description
        self.event_cost = event_cost
        self.event_sign_up = event_sign_up
        self.hl_pick_up = hl_pick_up
        self.ec_pickup = ec_pickup
        self.all_day = all_day
        self.event_start = event_start
        self.event_end = event_end
        self.event_location = event_location
        self.event_audiences = event_audiences
        self.event_categories = event_categories


class EventsInPeriod(object):
    """Retrieve a list of events that occur in a particular period/audience(s)/category(s)."""
    sql = 'select event.id, event.event_name as name, event.event_description as description, event.event_cost as cost,'
    sql += ' event.event_sign_up as sign_up, event.event_EC_pickup as ec_pickup, event.event_HL_pick_up as hl_pickup, '
    sql += 'et.start as start, et.end as end, et.all_day_event as all_day, '
    sql += 'em3.meta_value as location, em.meta_value as audience, em2.meta_value as category '
    sql += 'from event '
    sql += 'join event_meta_tbl as emt '
    sql += 'join event_meta_tbl as emt2 '
    sql += 'join event_meta_tbl as emt3 '
    sql += 'join event_meta as em '
    sql += 'join event_meta as em2 '
    sql += 'join event_meta as em3 '
    sql += 'join event_time as et '
    sql += 'where '
    sql += 'et.start >= \'{}\' and et.end <= \'{}\' '
    sql += 'and emt.event_id = event.id and emt.meta_id = em.id '
    sql += 'and emt2.event_id = event.id and emt2.meta_id = em2.id '
    sql += 'and emt3.event_id = event.id and emt3.meta_id = em3.id '
    sql += 'and em.meta_key = \'audience\' and em.meta_value in ({}) '
    sql += 'and em2.meta_key = \'category\' and em2.meta_value in ({}) '
    sql += 'and et.event_id = event.id '
    sql += 'and em3.meta_key = \'location\' '
    sql += 'order by event.id, start;'

    def __init__(self, db_session, start_time, end_time, audiences: list, categories: list):
        self.session = db_session
        if type(start_time) == dt.datetime:
            self.start = start_time.strftime('%Y-%m-%d %H:%M:%S')
            self.end = end_time.strftime('%Y-%m-%d %H:%M:%S')
        else:       # TODO:  What is this else clause supposed to be???
            self.start = start_time.data.strftime('%Y-%m-%d %H:%M:%S')
            self.end = end_time.data.strftime('%Y-%m-%d %H:%M:%S')
        self.audiences = ", ".join([quotify(x.upper()) for x in audiences])
        self.categories = ", ".join([quotify(x.lower()) for x in categories])
        full_sql = EventsInPeriod.sql.format(self.start, self.end, self.audiences, self.categories)
        res = db_session.execute(full_sql)
        all_events = []
        last_id = None
        last_start = None
        evt = None
        auds = None
        cats = None
        try:
            for ev_id, name, desc, cost, signup, ec_pickup, hl_pickup, start, ev_end, all_day, \
                    location, audience, category in res.fetchall():
                # Note - the query returns a separate row for each audience or category if multiple
                #       audiences and/or categories are requested.  They will share a common event.id
                #       and will start at the same time.  The query is ordered by id then start, so we
                #       can create the actual event on the first change then accumulate additional events
                #       by updating the audience or category as appropriate.  Note also that we depend on
                #       the fact that the created value in Evt is a REFERENCE to a list that we can update
                #       after Evt has been created.
                if ev_id != last_id or start != last_start:
                    if last_id:
                        evt.event_audiences = auds
                        evt.event_categories = cats
                        all_events.append(evt)
                    evt = Evt(ev_id, name, desc, cost, signup, hl_pickup, ec_pickup, all_day, start, ev_end,
                              location, auds, cats)
                    last_id = ev_id
                    last_start = start
                    auds = [audience]
                    cats = [category]
                else:
                    if audience not in auds:
                        auds.append(audience)
                    if category not in cats:
                        cats.append(category)
                evt.event_audiences = auds
                evt.event_categories = cats
                all_events.append(evt)
            self.all_events = all_events
        except Exception as e:
            raise e

    def get_events(self):
        return self.all_events

    def get_events_as_dict(self):
        """Create dict with properties suitable for Calendar.js"""
        # calendar.js attributes: id, groupId, allDay, start, end, title, url, classNames, editable(=False)
        event_list = []
        for event in self.all_events:
            this_event = {'id': event.id, 'title': event.event_name,
                          'description': event.event_description,
                          'categories': event.event_categories,
                          'audiences': event.event_audiences,
                          'groupId': None, 'allDay': event.all_day,
                          'start': event.event_start.isoformat(),
                          'end': event.event_end.isoformat(),
                          'className': 'info'}
            event_list.append(this_event)
        return event_list


if __name__ == '__main__':
    class dummy(object):
        def __init__(self, el):
            self.data = el
    df = '/home/don/devel/nightly-scripts/worktemp/calendars/JanuaryCalendar.csv'
    engine = su.get_engine()
    session = su.create_session(engine)
    tables = su.create_tables(engine)
    st = dummy(dt.datetime(2020, 1, 15, 8))
    end = dummy(dt.datetime(2020, 1, 17, 8))
    out = EventsInPeriod(session, st, end, ['IL', 'al'], ['wellness', 'event'])
    # res = get_random_events(session, 10)
    foo = 3
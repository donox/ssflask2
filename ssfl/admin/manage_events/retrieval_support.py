from db_mgt.event_tables import Event, EventMeta, EventTime, event_meta_tbl
import csv
import datetime as dt
import random


# These are needed when running standalone
from pathlib import Path
from dotenv import load_dotenv
env_path = '/home/don/devel/ssflask2/.env'
load_dotenv(dotenv_path=env_path)
import db_mgt.setup as su

def get_random_events(session, count):
    all = session.query(Event.id).all()
    events_to_return = []
    nbr_events = len(all)
    for i_cnt in range(count):
        events_to_return.append(all[random.randint(0,nbr_events-1)].id)
    res = session.query(Event).filter(Event.id.in_(events_to_return)).all()
    return res


def quotify(x):
    return "'" + x + "'"

class Evt(object):
    """Intermediate Event object to handle SQL result that is not proper SQLAlchemy object"""
    # TODO: Add Location
    def __init__(self, id, event_name, event_description, event_cost, event_sign_up, hl_pick_up, ec_pickup,
                 all_day, event_occurs, event_start, event_end):
        self.id = id
        self.event_name = event_name
        self.event_description = event_description
        self.event_cost = event_cost
        self.event_sign_up = event_sign_up
        self.hl_pick_up = hl_pick_up
        self.ec_pickup = ec_pickup
        self.all_day = all_day
        self.event_occurs = event_occurs
        self.event_start = event_start
        self.event_end = event_end
        self.event_location = None


class EventsInPeriod(object):
    """Retrieve a list of events that occur in a particular period/audience(s)/category(s)."""
    sql = 'select event.id, event.event_name as name, event.event_description as description, event.event_cost as cost, '
    sql += 'event.event_sign_up as sign_up, event.event_EC_pickup as ec_pickup, event.event_HL_pick_up as hl_pickup, '
    sql += 'et.start as start, et.end as end, et.all_day_event as all_day'
    # sql += 'em3.meta_value as location '
    sql += ' from event '
    sql += 'join ssflask2.event_meta_tbl as emt '
    sql += 'join ssflask2.event_meta_tbl as emt2 '
    sql += 'join ssflask2.event_meta_tbl as emt3 '
    sql += 'join ssflask2.event_meta as em '
    sql += 'join ssflask2.event_meta as em2 '
    sql += 'join ssflask2.event_meta as em3 '
    sql += 'join event_time as et '
    sql += 'where '
    sql += 'emt.event_id = event.id and emt.meta_id = em.id '
    sql += 'and emt2.event_id = event.id and emt2.meta_id = em2.id '
    sql += 'and emt3.event_id = event.id and emt3.meta_id = em3.id '
    sql += 'and em.meta_key = \'audience\' and em.meta_value in ({}) '
    sql += 'and em2.meta_key = \'category\' and em2.meta_value in ({}) '
    sql += 'and et.event_id = event.id ;'
    # sql += 'and em3.meta_key = \'location\';'

    def __init__(self, session, start: dt.datetime, end: dt.datetime, audiences: list, categories: list):
        self.session = session
        self.start = start
        self.end = end
        self.audiences = ", ".join([quotify(x.upper()) for x in audiences])
        self.categories = ", ".join([quotify(x.lower()) for x in categories])
        full_sql = EventsInPeriod.sql.format(self.audiences, self.categories)
        res = session.execute(full_sql)
        all_events = []
        for id, name, desc, cost, signup, ec_pickup, hl_pickup, start, end, all_day in res.fetchall():
            evt = Evt(id, name, desc, cost, signup, hl_pickup, ec_pickup, all_day, 'x', start, end)
            all_events.append(evt)
        self.all_events = all_events


if __name__ == '__main__':
    df = '/home/don/devel/nightly-scripts/worktemp/calendars/JanuaryCalendar.csv'
    engine = su.get_engine()
    session = su.create_session(engine)
    tables = su.create_tables(engine)
    st = dt.datetime(2020, 1, 15, 8)
    end = dt.datetime(2020, 1, 17, 8)
    out = EventsInPeriod(session, st, end, ['IL', 'al'], ['wellness', 'event'])
    # res = get_random_events(session, 10)
    foo=3
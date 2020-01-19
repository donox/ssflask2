from config import Config
from lxml.html import html5parser as hp
import lxml
from db_mgt.event_tables import Event, EventMeta, EventTime
from flask import render_template
from ssfl.admin.manage_events.retrieval_support import get_random_events, EventsInPeriod, Evt
from flask.views import MethodView
from db_mgt.setup import get_engine, create_session, close_session
import datetime as dt


class Calendar(object):
    def __init__(self, session, width):
        width_sizes = {3: 'is-one-quarter',
                       4: 'is-one-third',
                       6: 'is-half',
                       8: 'is-two-thirds',
                       12: 'is-full'}
        self.cal_data = dict()
        self.session = session
        self.snippet_width = width  # Width to display on front page in columns (1-12)
        self.cal_data['width'] = width
        self.cal_data['width-class'] = None
        if width in width_sizes.keys():
            self.cal_data['width-class'] = width_sizes[width]

    def create_daily_plugin(self, stuff, xx):
        start = dt.datetime.now()
        end = dt.datetime.now() + dt.timedelta(hours=96)
        audience = ['IL', 'AL']
        categories = ['resident clubs', 'event', 'wellness']
        events = EventsInPeriod(self.session, start, end, audience, categories)
        events = events.all_events[0:6]
        res = []
        for event in events:
            evt_dict = {}
            evt_dict['title'] = event.event_name
            evt_dict['description'] = event.event_description
            evt_dict['venue'] = event.event_location
            evt_dict['all_day'] = event.all_day
            evt_dict['ec_pickup'] = event.ec_pickup
            evt_dict['event_occurs'] = event.event_occurs
            evt_dict['event_cost'] = event.event_cost
            evt_dict['event_end'] = event.event_end
            evt_dict['event_start'] = event.event_start
            evt_dict['event_sign_up'] = event.event_sign_up
            evt_dict['hl_pick_up'] = event.hl_pick_up
            res.append(evt_dict)
        self.cal_data['events'] = res

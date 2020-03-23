from config import Config
from lxml.html import html5parser as hp
import lxml
from db_mgt.event_tables import Event, EventMeta, EventTime
from flask import render_template
from ssfl.admin.manage_events.event_retrieval_support import get_random_events, SelectedEvents, Evt
from flask.views import MethodView
from db_mgt.setup import get_engine, create_session, close_session
import datetime as dt
from db_mgt.json_tables import JSONStorageManager


calendar_audiences = ['IL', 'AL']
calendar_categories = ['resident clubs', 'event', 'wellness', 'religion', 'community']


class Calendar(object):
    def __init__(self, session, width):
        self.db_session = session
        self.cal_data = dict()
        self.cal_data['width'] = width

    def create_daily_plugin(self, event_count, audiences=calendar_audiences, categories=calendar_categories):
        start = dt.datetime.now()
        end = dt.datetime.now() + dt.timedelta(hours=96)
        events = SelectedEvents(self.db_session, start, end, audiences, categories)
        events = events.all_events[0:event_count]
        res = []
        jsm = JSONStorageManager(self.db_session)
        empty_event = jsm.get_json_from_name('P_EVENT_SNIPPET')
        for event in events:
            evt_dict = empty_event.copy()
            evt_dict['name'] = event.event_name
            evt_dict['venue'] = event.event_location
            evt_dict['date'] = event.event_start.date().strftime('%b-%d')
            evt_dict['time'] = event.event_start.time().strftime('%H:%M')
            res.append(evt_dict)
        self.cal_data['events'] = res

    def get_calendar_snippet_data(self):
        return self.cal_data

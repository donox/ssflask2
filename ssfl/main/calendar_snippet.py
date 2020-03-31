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
    def __init__(self, db_exec, width):
        self.db_exec = db_exec
        self.cal_data = dict()
        self.cal_data['width'] = width

    def create_daily_plugin(self, event_count, audiences=calendar_audiences, categories=calendar_categories):
        start = dt.datetime.now()
        end = dt.datetime.now() + dt.timedelta(hours=96)
        events = SelectedEvents(self.db_exec, start, end, audiences, categories)
        dupe_check = set()
        res = []
        jsm = self.db_exec.create_json_manager()
        empty_event = jsm.get_json_from_name('P_EVENT_SNIPPET')
        current_count = event_count
        for event in events.all_events:
            evt_dict = empty_event.copy()
            evt_dict['name'] = event.event_name
            evt_dict['venue'] = event.event_location
            evt_dict['date'] = event.event_start.date().strftime('%b-%d')
            evt_dict['time'] = event.event_start.time().strftime('%H:%M')
            dupe = evt_dict['name'] + evt_dict['venue'] + evt_dict['date'] + evt_dict['time']
            if dupe not in dupe_check:
                res.append(evt_dict)
                dupe_check.add(dupe)
                current_count -= 1
                if not current_count:
                    break
        self.cal_data['events'] = res

    def get_calendar_snippet_data(self):
        return self.cal_data

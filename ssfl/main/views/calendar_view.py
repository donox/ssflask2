from config import Config
from lxml.html import html5parser as hp
import lxml
from db_mgt.event_tables import Event, EventMeta, EventTime
from flask import render_template
from ssfl.admin.manage_events.event_retrieval_support import get_random_events
from flask.views import MethodView
from db_mgt.setup import get_engine, create_session, close_session


class RandomCalendarAPI(MethodView):
    def get(self, count):
        db_session = create_session(get_engine())
        if count==None:
            count = 10
        events = get_random_events(db_session, count)
        context = {'events': []}
        for event in events:
            this_event={}
            this_event['title'] = event.event_name
            # this_event['venue'] = event.event_location        # this is foreign key
            this_event['description'] = event.event_description
            context['events'].append(this_event)
        close_session(db_session)
        res = render_template('main/calendar_plugin.html', **context)
        return res

    def post(self):
        pass

    def delete(self, xxx):
        pass

    def put(self, xxx):
        pass

# See   https://flask.palletsprojects.com/en/1.1.x/views/
# user_view = UserAPI.as_view('user_api')
# app.add_url_rule('/users/', defaults={'user_id': None},
#                  view_func=user_view, methods=['GET',])
# app.add_url_rule('/users/', view_func=user_view, methods=['POST',])
# app.add_url_rule('/users/<int:user_id>', view_func=user_view,
#                  methods=['GET', 'PUT', 'DELETE'])

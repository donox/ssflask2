from ssfl import db
import datetime as dt
from sqlalchemy.orm import defer
import json as jsn


class JSONStorageManager(object):
    descriptor_picture_fields = ["PICTURE", "id", "url", "title", "caption", "width", "height", "alignment", "alt_text",
                                 "css_style", "css_class", "title_class", "caption_class", "image_class"]
    descriptor_slideshow_fields = ["SLIDESHOW", "title", "title_class", "position", "width", "height", "rotation",
                                   "frame_title", "pictures"]
    descriptor_story_fields = ["STORY", "id", "title", "name", "author", "date", "content", "snippet"]
    descriptor_button_fields = ["BUTTON", "id", "button_type", "target", "text_content"]
    descriptor_page_layout = ["PAGE", "name", "row_count", "column_count", "rows", "cells"]
    descriptor_row_layout = ["ROW", "cells", "column_width"]
    descriptor_column_layout = ["COLUMN", "cells"]
    descriptor_cell_layout = ["CELL", "element_type", "element", "width"]
    descriptor_story_snippet_fields = ["STORY_SNIPPET", "id", "title", "name", "author", "date", "snippet", "photo",
                                       "content", "story_url", "read_more"]
    descriptor_calendar_snippet_fields = ["CALENDAR_SNIPPET", "events", "event_count"]
    descriptor_event_snippet_fields = ["EVENT_SNIPPET", "name", "date", "time", "venue"]

    def __init__(self, db_session):
        self.db_session = db_session
        cls = JSONStorageManager
        self.all_fields = dict()
        self.all_fields['PICTURE'] = cls.descriptor_picture_fields
        self.all_fields['SLIDESHOW'] = cls.descriptor_slideshow_fields
        self.all_fields['STORY'] = cls.descriptor_story_fields
        self.all_fields['BUTTON'] = cls.descriptor_button_fields
        self.all_fields['PAGE'] = cls.descriptor_page_layout
        self.all_fields['ROW'] = cls.descriptor_row_layout
        self.all_fields['COLUMN'] = cls.descriptor_column_layout
        self.all_fields['CELL'] = cls.descriptor_cell_layout
        self.all_fields['STORY_SNIPPET'] = cls.descriptor_story_snippet_fields
        self.all_fields['CALENDAR_SNIPPET'] = cls.descriptor_calendar_snippet_fields
        self.all_fields['EVENT_SNIPPET'] = cls.descriptor_event_snippet_fields
        # self.all_fields[''] = cls.

    def update_db_with_descriptor_prototype(self):
        """Update the definitions of each descriptor in the database as a prototype."""
        for key, val in self.all_fields.items():
            db_name = 'PROTO_' + key
            if self.get_json_from_name(db_name):
                self.delete_descriptor(db_name)
            desc = self.make_json_descriptor(db_name, val)
            self.add_json(db_name, desc)

    @staticmethod
    def make_json_descriptor(desc_type, descriptor):
        res = dict()
        res['type'] = desc_type
        for el in descriptor:
            res[el] = None
        return res

    def get_json_from_name(self, name):
        res = self.db_session.query(JSONStore).filter(JSONStore.name == name).first()
        if res:
            json = jsn.loads(res.content)
            return json
        else:
            return None

    def get_json_from_id(self, id_nbr):
        res = self.db_session.query(JSONStore).filter(JSONStore.id == id_nbr)
        if res:
            json = jsn.loads(res.first())
            return json
        else:
            return None

    def add_json(self, name, content):
        exists = self.get_json_from_name(name)
        if type(content) is str:
            json_content = content
        else:
            json_content = jsn.dumps(content)
        today = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if exists:
            db_row = self.db_session.query(JSONStore).filter(JSONStore.name == name).first()
            db_row.content = json_content
            db_row.last_update = today
            db_row.status = 'active'
            self.db_session.commit()
        else:
            db_row = JSONStore(name=name, content=json_content, status='active', last_update=today)
            db_row.add_to_db(self.db_session, commit=True)


class JSONStore(db.Model):
    __tablename__ = 'json_store'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(), nullable=False, unique=True)
    active = db.Column(db.Boolean(), default=True)
    last_update = db.Column(db.DateTime, default='2000-01-01')
    content = db.Column(db.String(), nullable=True)
    status = db.Column(db.String(32), nullable=False)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
                raise e
        return self

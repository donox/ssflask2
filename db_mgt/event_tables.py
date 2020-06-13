from ssfl import db
from .base_table_manager import BaseTableManager
import datetime as dt
from utilities.sst_exceptions import log_sst_error

calendar_categories = ['Religion', 'Wellness', 'Resident Clubs', 'Event']

calendar_audiences = ['IL', 'AL', 'HC']

# Table supporting many-many relationships between events and metadata items.
event_meta_tbl = db.Table('event_meta_tbl', db.metadata,
                          db.Column('event_id', db.Integer, db.ForeignKey('event.id',
                                    ondelete='CASCADE'), primary_key=True),
                          db.Column('meta_id', db.Integer, db.ForeignKey('event_meta.id',
                                    ondelete='CASCADE'), primary_key=True),
                          extend_existing=True)

class EventManager(BaseTableManager):
    def __init__(self, db_session):
        super().__init__(db_session)
        self.db_session = db_session

    def add_event_to_database(self, event, commit=True):
        event.add_to_db(self.db_session, commit=commit)

    def delete_specific_event(self, event, cal_start, cal_end):
        event.delete_specific_event(self.db_session, cal_start, cal_end)

    def reset_calendar(self):
        self.db_session.query(EventTime).delete()
        self.db_session.query(Event).delete()
        self.db_session.query(EventMeta).delete()
        self.db_session.commit()
        for aud in calendar_audiences:
            evm = EventMeta(meta_key='audience', meta_value=aud)
            evm.add_to_db(self.db_session, commit=True)
        for cat in calendar_categories:
            evm = EventMeta(meta_key='category', meta_value=cat.lower())
            evm.add_to_db(self.db_session, commit=True)
        return True


class Event(db.Model):
    __tablename__ = 'event'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_name = db.Column(db.String(length=128), nullable=False)
    event_description = db.Column(db.String(length=8192))
    event_cost = db.Column(db.String(128), nullable=True)
    event_sign_up = db.Column(db.String(128), nullable=True)
    event_EC_pickup = db.Column(db.String(128), nullable=True)
    event_HL_pick_up = db.Column(db.String(128), nullable=True)
    event_to_meta = db.relationship('EventMeta', secondary='event_meta_tbl', lazy='subquery',
                                    backref=db.backref('meta_events', lazy=True))
    event_occurs = db.relationship('EventTime', backref=db.backref('events', lazy=True))

    def add_to_db(self, session, commit=False):
        try:
            session.add(self)
            if commit:
                session.commit()
        except Exception as e:
            log_sst_error(e.args)
            raise e
        return self


class EventTime(db.Model):
    __tablename__ = 'event_time'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(db.ForeignKey('event.id'))
    all_day_event = db.Column(db.Boolean())
    start = db.Column(db.DateTime(), default='2001-01-01 01:01:01')
    end = db.Column(db.DateTime(), default='2001-01-01 01:01:01')

    def add_to_db(self, session, commit=False):
        try:
            session.add(self)
            if commit:
                session.commit()
        except Exception as e:
            log_sst_error(e.args)
            raise e
        return self


class EventMeta(db.Model):
    """EventMeta contains information associated with an event.

       There are many-one relations from events to a location as a meta value.
       There are many-many relations supporting audiences and categories. """
    __tablename__ = 'event_meta'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    meta_key = db.Column(db.String(length=128), nullable=False)
    meta_value = db.Column(db.String(length=128), nullable=True)
    events = db.relationship(Event, secondary='event_meta_tbl', backref='event_to_metas')

    def add_to_db(self, session, commit=False):
        try:
            session.add(self)
            if commit:
                session.commit()
        except Exception as e:
            log_sst_error(e.args)
            raise e
        return self

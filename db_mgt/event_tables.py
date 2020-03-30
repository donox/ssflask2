from ssfl import db
from .base_table_manager import BaseTableManager
import datetime as dt

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
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
        return self


class EventTime(db.Model):
    __tablename__ = 'event_time'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(db.ForeignKey('event.id'))
    all_day_event = db.Column(db.Boolean())
    start = db.Column(db.DateTime(), default='2001-01-01 01:01:01')
    end = db.Column(db.DateTime(), default='2001-01-01 01:01:01')

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
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
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
        return self

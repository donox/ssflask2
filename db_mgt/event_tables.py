from ssfl import db
import datetime as dt

db.metadata.clear()

# Table supporting many-many relationships between events and metadata items.
event_meta_tbl = db.Table('event_meta_tbl',
                          db.Column('event_id', db.Integer, db.ForeignKey('event.id',
                                    ondelete='CASCADE'), primary_key=True),
                          db.Column('meta_id', db.Integer, db.ForeignKey('event_meta.id',
                                    ondelete='CASCADE'), primary_key=True),
                          extend_existing=True)


class Event(db.Model):
    __tablename__ = 'event'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_name = db.Column(db.String(length=128), nullable=False)
    event_description = db.Column(db.String(length=1024))
    event_location = db.Column(db.ForeignKey('event_meta.id'))
    event_cost = db.Column(db.String(128), nullable=True)
    event_sign_up = db.Column(db.String(128), nullable=True)
    event_EC_pickup = db.Column(db.String(128), nullable=True)
    event_HL_pick_up = db.Column(db.String(128), nullable=True)
    event_to_meta = db.relationship('EventMeta', secondary=event_meta_tbl, lazy='subquery',
                                    backref=db.backref('event', lazy=True))

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

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
        return self

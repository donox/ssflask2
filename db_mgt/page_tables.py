from sqlalchemy import Column, ForeignKey, Integer, String, Date, Boolean, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.pool import NullPool
from application import Base
import datetime as dt


class Page(Base):
    __tablename__ = 'page'
    _instances_ = {}
    id = Column(Integer, primary_key=True, autoincrement=True)
    page_title = Column(String(), nullable=False)
    page_name = Column(String(), nullable=False, unique=True)
    page_active = Column(Boolean(), default=True)
    page_author = Column(String(128), nullable=True)
    page_date = Column(Date, default='2000-01-01')
    page_content = Column(String(), nullable=True)
    page_status = Column(String(32), nullable=False)
    page_parent = Column(Integer, ForeignKey('page.id'), nullable=True)
    page_guid = Column(String(), nullable=False)
    page_cached = Column(Boolean(), default=False)
    page_do_not_cache = Column(Boolean(), default=False)
    page_cached_date = Column(Date(), default='2000-01-01')
    page_cached_content = Column(String(), nullable=True)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    def fetch_content(self, session):
        """Get content from page allowing for possibility that it is cached."""
        if self.page_cached:
            tmp = self.page_cached_date
            if type(tmp) is dt.datetime:
                tmp = tmp.date()
            if tmp >= self.page_date:               # Is there a problem failing to deal with time?
                return self.page_cached_content
            else:
                self.page_cached = False
                session.commit()
                return self.page_content
        else:
            return self.page_content

    def update_cache(self, session, new_text):
        print("page_tables.py update_cache disabled")
        return
        if not self.page_do_not_cache:
            self.page_cached_content = new_text
            self.page_cached = True                    # todo:  SHOULD BE TRUE EX DEBUG
            self.page_cached_date = dt.datetime.now()
            # session.commit()                          # commit handled at request completion

    def __repr__(self):
        return '<Flask Page {}>'.format(self.__tablename__)


class PageMeta(Base):
    __tablename__ = 'page_meta'
    _instances_ = {}
    id = Column(Integer, primary_key=True, autoincrement=True)
    page_id = Column(ForeignKey('page.id'), nullable=False)
    meta_key = Column(String(128), nullable=False)
    meta_value = Column(String(), nullable=True)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    def __repr__(self):
        return '<Flask PageMeta {}>'.format(self.__tablename__)
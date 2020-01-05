from sqlalchemy import Column, ForeignKey, Integer, String, Date, Boolean, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.pool import NullPool
from application import Base


class HandyUrl(Base):
    """Maybe useful class - or remove.  Table of interesting URL's."""
    __tablename__ = 'handy_url'
    _instances_ = {}
    id = Column(Integer, primary_key=True)
    short_name = Column(String(20))          # Descriptive (unique) name for url
    full_url = Column(String(128))
    purpose = Column(String(250))

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    def __repr__(self):
        return '<HandyUrl {}>'.format(self.__tablename__)

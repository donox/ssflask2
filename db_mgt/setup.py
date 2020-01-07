from sqlalchemy import Column, ForeignKey, Integer, String, Date, Boolean, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.pool import NullPool
from config import Config
from application import Base


# Database login used to work with user 'root'.  Now 'root' requires sudo access (post rebuild of system).
# See stackoverflow.com/questions/37239970/connect-to-mysql-server-without-sudo
def get_engine():
    try:
        db_name = Config.SQLALCHEMY_DATABASE_NAME
        # Engine = django.db.backends.mysql
        # db_name = config['database']['Name']
        user = Config.SQLALCHEMY_USERNAME
        password = Config.SQLALCHEMY_PASSWORD
        login_string = Config.SQLALCHEMY_DATABASE_URI
        engine = create_engine(login_string, echo=False, poolclass=NullPool)
        engine.connect()
        print("sqlAlchemy engine connected successfully on: {}".format(login_string))
        return engine
    except OperationalError as err:
        print(type(err))
        print(err.args)
        print(err)
        raise


def create_tables(engine):
    Base.metadata.create_all(engine)
    return


def create_session(engine):
    Base.metadata.bind = engine
    db_session = sessionmaker(bind=engine)
    return db_session()


def close_session(session):
    if session.dirty or session.new or session.deleted:
        session.commit()
    session.close_all()

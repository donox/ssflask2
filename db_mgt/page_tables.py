from ssfl import db
import datetime as dt
from sqlalchemy.orm import defer
from .json_tables import JSONStorageManager as jsm

class PageManager(object):
    def __init__(self, db_session):
        self.db_session = db_session

    def generate_page_records(self, key_list):
        res = self.db_session.query(Page).options(defer('page_content'),
                                                  defer('page_cached_content')).all()
        for record in res:
            rec = record.__dict__
            rec_list = []
            for key in key_list:
                rec_list.append(rec[key])
            yield rec_list

    def get_page_from_name(self, name):
        res = self.db_session.query(Page).filter(Page.page_name == name).first()
        return res


class Page(db.Model):
    __tablename__ = 'page'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    page_title = db.Column(db.String(), nullable=False)
    page_name = db.Column(db.String(), nullable=False, unique=True)
    page_active = db.Column(db.Boolean(), default=True)
    page_author = db.Column(db.String(128), nullable=True)
    page_date = db.Column(db.DateTime, default='2000-01-01')
    page_content = db.Column(db.String(), nullable=True)
    page_status = db.Column(db.String(32), nullable=False)
    page_parent = db.Column(db.Integer, db.ForeignKey('page.id'), nullable=True)
    page_guid = db.Column(db.String(), nullable=False)
    page_cached = db.Column(db.Boolean(), default=False)
    page_do_not_cache = db.Column(db.Boolean(), default=False)
    page_cached_date = db.Column(db.DateTime, default='2000-01-01')
    page_cached_content = db.Column(db.String(), nullable=True)
    page_do_not_import = db.Column(db.Boolean(), default=False)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
                raise e
        return self

    def get_json_descriptor(self):
        # ['id', 'title', 'name', 'author', 'date', 'content', ]
        res = jsm.make_json_descriptor('Story', jsm.descriptor_story_fields)
        res['id'] = self.id
        res['title'] = self.page_title
        res['name'] = self.page_name
        res['author'] = self.author
        res['date'] = self.page_date
        # res['content'] = self.page_date       # Can't pick up content for lack of a session
        return res

    def fetch_content(self, session):
        """Get content from page allowing for possibility that it is cached."""
        if self.page_cached:
            tmp = self.page_cached_date
            if type(tmp) is dt.datetime:
                tmp = tmp.date()            # looking only at the day
            if tmp >= self.page_date:       # possibly updated after caching - then dump cache
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


class PageMeta(db.Model):
    __tablename__ = 'page_meta'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    page_id = db.Column(db.ForeignKey('page.id'), nullable=False)
    meta_key = db.Column(db.String(128), nullable=False)
    meta_value = db.Column(db.String, nullable=True)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    def __repr__(self):
        return '<Flask PageMeta {}>'.format(self.__tablename__)
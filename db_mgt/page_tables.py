from application import db
import datetime as dt


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
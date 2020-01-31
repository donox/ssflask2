from ssfl import db
import datetime as dt


class IndexPage(db.Model):
    __tablename__ = 'index_page'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    page_title = db.Column(db.String(length=128), nullable=False)
    page_name = db.Column(db.String(length=128), nullable=False, unique=True)   # name used in urls
    page_content = db.Column(db.String(length=8192), nullable=True)
    page_cached = db.Column(db.Boolean(), default=False)
    sequence_type = db.Column(db.String(length=32), nullable=False)  # numeric, inverse numeric, date, name
    page_template = db.Column(db.String(length=128), nullable=True)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
        return self


class IndexPageItem(db.Model):
    __tablename__ = 'index_page_item'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    item_name = db.Column(db.String(length=128), nullable=True)
    item_index_page = db.Column(db.ForeignKey('index_page.id'), nullable=True)
    button_name = db.Column(db.String(length=128), nullable=False)
    button_page_url = db.Column(db.ForeignKey('page.id'), nullable=True)  # one of url's must exist to work
    button_url_link = db.Column(db.String(length=256), nullable=True)
    item_content = db.Column(db.String(length=1024), nullable=True)
    item_date = db.Column(db.DateTime, default='2000-01-01')
    sequence = db.Column(db.Integer, default=0)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
        return self
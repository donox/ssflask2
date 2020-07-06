from ssfl import db
import datetime as dt
from sqlalchemy.orm import defer
from .json_tables import JSONStorageManager as jsm
from .base_table_manager import BaseTableManager
from utilities.sst_exceptions import SiteIdentifierError, SiteObjectNotFoundError
from utilities.miscellaneous import make_db_search_string


class PageManager(BaseTableManager):
    def __init__(self, db_session):
        super().__init__(db_session)

    def check_slug_existence(self, slug):
        sql = f'select exists(select * from page where page_name="{slug}");'
        return self.db_session.execute(sql).first()[0]

    def get_page_if_exists(self, page_id, page_name):
        if page_id:
            target_page = self.db_session.query(Page).filter(Page.id == page_id).first()
            return target_page
        elif page_name:
            target_page = self.db_session.query(Page).filter(Page.page_name == page_name.lower()).first()
            return target_page
        else:
            return None

    def fetch_page(self, page_id, page_name):
        """Fetch page from database, using cached page if it exists and is current."""
        try:
            target_page = self.get_page_if_exists(page_id, page_name)
            if target_page:
                return target_page
            else:
                raise SiteObjectNotFoundError(page_id, page_name, 'DB returned null result')
        except Exception as e:
            print(e.args)
            target_page = self._dummy_result_page(page_id, page_name)
            return target_page

    def _dummy_result_page(self, page_id, page_name):
        """Dummy page for failing retrieve."""
        result = Page()
        result.page_title = 'Page Not Found: {}'.format(page_name)
        result.page_content = '''<p>Fail when loading page with id/name: {}/{}</p>'''.format(page_id, page_name)
        return result

    def delete_page(self, page_id, page_name):
        page = self.get_page_if_exists(page_id, page_name)
        if page:
            self.db_session.delete(page)
            self.db_session.commit()
            return True
        else:
            return None

    def generate_page_records(self, key_list):
        res = self.db_session.query(Page).options(defer('page_content'),
                                                  defer('page_cached_content')).all()
        for record in res:
            rec = record.__dict__
            rec_list = []
            for key in key_list:
                rec_list.append(rec[key])
            yield rec_list

    def update_cached_page(self, page, res):
        print("page_tables.py update_cache disabled")
        return
        if not page.page_do_not_cache:
            page.page_cached_content = res
            page.page_cached = True  # todo:  SHOULD BE TRUE EX DEBUG
            page.page_cached_date = dt.datetime.now()
            # session.commit()

    def add_page_to_database(self, page, overwrite):
        try:
            pg = self.get_page_if_exists(None, page.page_name)
            if pg:
                if overwrite:
                    self.update_table(page, pg, 'Page')
                else:
                    raise ValueError(f'Page {pg.id} already exists')   # Replace with SsT Error
            else:
                page.add_to_db(self.db_session, commit=True)
        except Exception as e:
            foo = 3
            raise e

    def get_recent_pages(self, nbr_to_get):
        sql = f'select id from page order by page_date desc limit {nbr_to_get};'
        res = self.db_session.execute(sql)
        pages = []
        for ndx in res:
            new_page = self.get_page_if_exists(ndx[0], None)
            pages.append(new_page)
        return pages

    def get_records_by_field_search(self, field, search_string, nbr_to_get):
        search = make_db_search_string(search_string)
        sql = f'select id from page where {field} like "{search}"'    # ' collate utf8_general_ci '
        sql += f'order by page_date desc limit {nbr_to_get}'
        res = self.db_session.execute(sql)
        pages = []
        for ndx in res:
            new_page = self.get_page_if_exists(ndx[0], None)
            pages.append(new_page)
        return pages

class Page(db.Model):
    __tablename__ = 'page'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    page_title = db.Column(db.String(), nullable=False)
    page_name = db.Column(db.String(), nullable=False, unique=True)
    page_active = db.Column(db.Boolean(), default=True)
    page_author = db.Column(db.String(128), nullable=True)
    page_date = db.Column(db.DateTime, default='2000-01-01')
    page_content = db.Column(db.String(), nullable=True)
    page_snippet = db.Column(db.String(), nullable=True)
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
        # res['snippet'] = self.page_snippet    # Can't pick up content for lack of a session
        return res

    def fetch_content(self, db_exec):
        """Get content from page allowing for possibility that it is cached."""
        if self.page_cached:
            tmp = self.page_cached_date
            if type(tmp) is dt.datetime:
                tmp = tmp.date()            # looking only at the day
            if tmp >= self.page_date:       # possibly updated after caching - then dump cache
                return self.page_cached_content
            else:
                self.page_cached = False
                db_exec.get_db_session.commit()
                return self.page_content
        else:
            return self.page_content

    def fetch_title_author_snippet(self):
        return self.page_title, self.page_author, self.page_snippet

    def update_cache(self, session, new_text):
        raise SystemError("moved to Page Manager")

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

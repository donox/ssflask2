from dotenv import load_dotenv

env_path = '/home/don/devel/ssflask2/.env'
load_dotenv(dotenv_path=env_path)
# remove above when done with __main__ debugging
from db_mgt.page_tables import Page
from db_mgt.index_page_tables import IndexPage, IndexPageItem
import db_mgt.setup as su
import datetime as dt
from ssfl.admin.forms.index_pages_form import ManageIndexPagesForm
from utilities.sst_exceptions import SiteObjectNotFoundError


class DBManageIndexPages(object):
    def __init__(self):
        self.index_page = None
        self.index_page_items = []
        self.index_page_name = None

        # id = db.Column(db.Integer, primary_key=True, autoincrement=True)
        # item_name = db.Column(db.String(length=128), nullable=True)
        # item_index_page = db.Column(db.ForeignKey('index_page.id'), nullable=True)
        # button_name = db.Column(db.String(length=128), nullable=False)
        # button_page_url = db.Column(db.ForeignKey('page.id'), nullable=True)  # one of url's must exist to work
        # button_url_link = db.Column(db.String(length=256), nullable=True)
        # item_content = db.Column(db.String(length=1024), nullable=True)
        # item_date = db.Column(db.DateTime, default='2000-01-01')
        # sequence = db.Column(db.Integer, default=0)

    def process_form(self, db_session, form: ManageIndexPagesForm):
        work_function = form.work_function.data
        if work_function == 'cip':
            self.index_page_name = form.page_name.data
            if self.index_page_name == '':
                form.errors['Page Name'] = 'Must provide page name to create a new page'
                return False
            try:
                res = db_session.query(IndexPage).filter(IndexPage.page_name == self.index_page_name).first()
                if res:
                    form.errors['Page Exists'] = 'Specified Index Page already exists.'
                    return False
            except SiteObjectNotFoundError as e:
                pass            # This is normal case
            self.create_new_index_page(db_session, page_title=form.page_title.data, page_name=form.page_name.data,
                                       page_template='manage_index_page.html')
            return True

        form.errors['Not Implemented'] = 'Specified Function not yet implemented.'
        return False

    def create_new_index_page(self, db_session, page_title=None, page_name=None, page_content=None, page_cached=False,
                              sequence_type='numeric', page_template=None):
        self.index_page = IndexPage(page_title=page_title, page_name=page_name, page_content=page_content,
                                    page_cached=page_cached, sequence_type=sequence_type, page_template=page_template)
        try:
            self.index_page.add_to_db(db_session, commit=True)
            self.index_page = db_session.query(IndexPage).filter(IndexPage.page_name == page_name).first()
        except SiteObjectNotFoundError as e:
            db_session.rollback()
            raise e

    def add_index_item(self, db_session, item_name=None,  button_page_url=None, button_name=None,
                       button_url_link=None, item_content=None, item_date=dt.datetime.now(), sequence=-1):
        mysql_datetime = None
        if item_date:
            mysql_datetime = item_date.strftime(('%Y-%m-%d %H:%M:%S'))
        new_item = IndexPageItem(item_name=item_name, item_index_page=self.index_page.id, button_name=button_name,
                                 button_page_url=button_page_url, button_url_link=button_url_link,
                                 item_content=item_content, item_date=mysql_datetime, sequence=sequence)
        try:
            new_item.add_to_db(db_session, commit=True)
            self.index_page_items.append(new_item)
        except Exception as e:
            foo = 3
            db_session.rollback()


if __name__ == '__main__':
    engine = su.get_engine()
    session = su.create_session(engine)
    tables = su.create_tables(engine)
    mip = DBManageIndexPages()
    mip.create_new_index_page(session, page_title="Hello There", page_name='r-s-t', page_content="Hi there")
    mip2 = DBManageIndexPages()
    mip2.create_new_index_page(session, page_title="Hello ThereXX", page_name='r-s-t-x', page_content="Hi thereXX")
    mip.add_index_item(session, item_name="ONE", button_name='BUTTON1', item_content='Have a good day')
    mip.add_index_item(session, item_name="TwO", button_name='BUTTON2', item_content='Have a bad day')
    foo = 3

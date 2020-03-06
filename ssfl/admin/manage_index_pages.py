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

        # item_index_page = db.Column(db.ForeignKey('index_page.id'), nullable=True)
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
                pass  # This is normal case
            self.create_new_index_page(db_session, page_title=form.page_title.data, page_name=form.page_name.data,
                                       page_template='manage_index_page.jinja2')
            return True
        elif work_function == 'aii':
            btn_url = form.button_url_link.data
            if btn_url == '':
                btn_url = None
            btn_name = form.button_name.data
            btn_page = form.button_page_name.data
            if btn_page == '':
                btn_page = None
            item_name = form.item_name.data
            page_name = form.page_name.data
            try:
                self.index_page = db_session.query(IndexPage).filter(IndexPage.page_name == page_name).first()
            except SiteObjectNotFoundError as e:
                form.error['Page Not Found'] = 'Index page with given name not found'
                return False
            if (not btn_page and not btn_url) or (btn_page and btn_url):
                form.errors['Button Targets'] = 'Must specify exactly one of Button Target Page or Button URL.'
                return False
            if btn_page:
                target_page = None
                try:
                    target_page = db_session.query(Page).filter(Page.page_name == btn_page).first()
                except SiteObjectNotFoundError as e:
                    form.errors['Missing Target'] = 'Target page does not exist.'
                    return False
                target_page = target_page.id
            if btn_name == '':
                form.errors['Button Name'] = 'Must specify Button Name.'
                return False
            if item_name == '':
                form.errors['Item Name'] = 'Must specify Item Name.'
                return False
            try:
                index_item = IndexPageItem(item_name=item_name, item_index_page=self.index_page.id,
                                           button_name=btn_name, button_page_url=target_page, button_url_link=btn_url,
                                           item_content=form.item_content.data, item_date=None, sequence=0)
                index_item.add_to_db(db_session, commit=True)
            except Exception as e:
                db_session.rollback()
                raise e

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

    def add_index_item(self, db_session, item_name=None, button_page_url=None, button_name=None,
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


def build_index_page_context(db_session, page):
    context = dict()
    context['title'] = page.page_title
    context['content'] = page.page_content
    item_list = []
    context['items'] = item_list

    items = db_session.query(IndexPageItem).filter(IndexPageItem.item_index_page == page.id).all()
    for item in items:
        item_dict = dict()
        item_dict['name'] = item.item_name
        item_dict['button_name'] = item.button_name
        item_dict['content'] = item.item_content
        item_dict['number'] = item.sequence
        item_dict['link_type'] = 'page' if item.button_page_url else 'url'
        item_dict['button_page'] = item.button_page_url
        item_dict['button_url'] = item.button_url_link
        item_list.append(item_dict)
    return context


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

from test_base import BaseTestCase
from db_mgt.db_exec import DBExec
from db_mgt.page_tables import Page


class TestPageTables(BaseTestCase):

    def setUp(self):
        self.db_exec = DBExec()
        self.mgr_pages = self.db_exec.create_page_manager()
        self.test_page = Page(page_author='George Washington', page_name='georges-test-page', page_content='DUMMY',
                              page_title='1776 or Bust', page_status='active', page_guid='Not Implemented')
        self.test_page.add_to_db(self.db_exec.db_session, commit=True)

    def tearDown(self):
        self.mgr_pages.delete_page(None, 'DUMMY')
        self.db_exec.db_session.commit()

    def test_fetch_page(self):
        try:
            name = 'georges-test-page'
            page = self.mgr_pages.get_page_if_exists(None, name)
            self.assertEqual('DUMMY', page.page_content)
        except Exception as e:
            raise SystemError(f'Exception trying to retrieve a page: {e.args}')

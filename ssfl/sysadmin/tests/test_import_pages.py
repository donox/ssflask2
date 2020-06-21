from test_base import BaseTestCase
from db_mgt.setup import create_session, get_engine
from ssfl.sysadmin import db_import_pages as dip


class TestImportPages(BaseTestCase):
    def test_get_fields_from_table(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPageData(db_session)
            fields = mgr.get_table_fields('wp_posts')
            self.assertEqual(len(fields), 23, 'Wrong number of fields returned')
        except Exception as e:
            pass
        finally:
            db_session.close()

    def test_get_data_from_table(self):
        db_session = create_session(get_engine())
        try:
            result = [556249, 594898, 752117, 862560, 927048, 1145506, 1286624, 965505, 1418183, 1416174, 1464464,
                      1401920, 1542798, 1543851, 1631668, 14, 21, 24, 45, 157, 159, 163, 165, 167, 279, 282, 396, 811,
                      1028, 1038, 1548, 2881, 3309, 3930, 5360, 5603, 7365, 8503, 8797, 8800, 8941, 8949, 8951, 8953,
                      8955, 8971, 12321, 14891, 16731, 17245]
            count = 50
            res_list = []
            mgr = dip.ImportPageData(db_session)
            for res in mgr.get_wp_post_data():
                for x, y in res:
                    res_list.append(y)
                    break
                count -= 1
                if not count:
                    break
            self.assertEqual(res_list, result, 'Incorrect page found in last 50 pages')
        finally:
            db_session.close()

    def test_get_username(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPageData(db_session)
            user = mgr.get_author(1)
            self.assertEqual(user, 'Don Oxley', 'Get username fails')
        finally:
            db_session.close()

    def test_get_pagename(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPageData(db_session)
            guid = mgr.get_row_from_id(143)[18]
            pagename = mgr.get_page_slug(guid)
            self.assertEqual(pagename, 'wp', 'Get username fails')
        finally:
            db_session.close()

    def test_current_revision(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPageData(db_session)
            max_page = mgr.find_most_recent_revision(1054470)
            self.assertEqual(max_page, 1056082, 'Retrieved most recent page')
        finally:
            db_session.close()

    def test_import_page(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPageData(db_session)
            max_page = mgr.find_most_recent_revision(1542798)
            page_row = mgr.get_row_from_id(max_page)
            mgr.import_page(page_row)
        finally:
            db_session.close()

    def test_import_all_pages(self):
        db_session = create_session(get_engine())
        dummy_page_name = 'page-dummy-{}'
        dummy_count = 0
        try:
            mgr = dip.ImportPageData(db_session)
            field_post_name = mgr.get_field_index('post_name', 'wp_posts')
            for page_row in mgr.get_wp_post_data():
                pr = [x for x in page_row]
                if not pr[field_post_name]:
                    pr[field_post_name] = dummy_page_name.format(dummy_count)
                    dummy_count += 1
                mgr.import_page(pr)
        finally:
            db_session.close()




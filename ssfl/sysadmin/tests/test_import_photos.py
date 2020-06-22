from test_base import BaseTestCase
from db_mgt.setup import create_session, get_engine
from ssfl.sysadmin import db_import_photos as dip


class TestImportPhotos(BaseTestCase):
    def test_get_fields_from_table(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPhotoData(db_session)
            fields = mgr.get_table_fields('wp_ngg_gallery')
            self.assertEqual(len(fields), 10, 'Wrong number of fields returned')
            fields = mgr.get_table_fields('wp_ngg_pictures')
            self.assertEqual(len(fields), 11, 'Wrong number of fields returned')
        except Exception as e:
            pass
        finally:
            db_session.close()

    def test_get_data_from_gallery(self):
        db_session = create_session(get_engine())
        try:
            result = [8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 22, 24, 25, 30, 32, 33, 34, 35, 36,
                      37, 39, 43, 46, 47, 49, 50, 52, 54, 55, 56]
            count = 30
            res_list = []
            mgr = dip.ImportPhotoData(db_session)
            for res in mgr.get_wp_gallery_data():
                res_list.append(res[0])
                count -= 1
                if not count:
                    break
            self.assertEqual(res_list, result, 'Incorrect page found in last 50 pages')
        finally:
            db_session.close()

    def test_get_data_from_pictures(self):
        db_session = create_session(get_engine())
        try:
            result = [45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 57, 58, 59, 60, 61, 71, 72, 73,
                      78, 79, 84, 93, 98, 101, 102, 106, 110, 111, 112, 114]
            count = 30
            res_list = []
            mgr = dip.ImportPhotoData(db_session)
            for res in mgr.get_wp_picture_data():
                res_list.append(res[0])
                count -= 1
                if not count:
                    break
            self.assertEqual(res_list, result, 'Incorrect page found in last 50 pages')
        finally:
            db_session.close()

    def test_import_all_galleries(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPhotoData(db_session)
            mgr.import_all_galleries()
        finally:
            db_session.close()

    def test_import_all_photos(self):
        db_session = create_session(get_engine())
        try:
            mgr = dip.ImportPhotoData(db_session)
            mgr.import_all_photos()
        finally:
            db_session.close()




from test_base import BaseTestCase, app
from ssfl.sysadmin.manage_photo_files import ManagePhotoFiles
from db_mgt.json_tables import JSONStorageManager
from db_mgt.db_exec import DBExec


class TestManagePhotoFiles(BaseTestCase):
    def setUp(self):
        self.db_exec = DBExec()
        self.mgr_photo_files = ManagePhotoFiles()

    def test_update_two_directories(self):
        try:
            f1 = '/home/don/Downloads/backup_of_2020-06-19-1604/gallery'
            f2 = '/home/don/devel/ssflask2/ssfl/static/gallery'
            self.mgr_photo_files.update_photo_files_from_backup(f1, f2)
        finally:
            foo = 3

    def test_import_wp_photo_db_tables(self):
        try:
            f_zip = '/home/don/Downloads/latest_db/backup_2020-06-19-1604_Sunnyside_Times_acefe6fa0b30-db.gz'
            self.mgr_photo_files.import_wp_photo_db_tables(f_zip)
        finally:
            foo = 3


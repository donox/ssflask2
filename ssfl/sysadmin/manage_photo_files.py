from filecmp import dircmp
import shutil
import os
import gzip
from utilities.sst_exceptions import sst_syslog
from db_mgt.db_exec import DBExec




class ManagePhotoFiles(object):
    def __init__(self):
        self.db_exec = DBExec()

    def update_photo_files_from_backup(self, local_directory, gallery):
        try:
            tmp_src = None
            tmp_dst = None
            tmp_file_src = None
            comparator = dircmp(local_directory, gallery)
            common_dirs = comparator.common_dirs
            dirs_to_add = comparator.left_only
            for dir_to_copy in dirs_to_add:
                tmp_src = local_directory + '/' + dir_to_copy + '/'
                tmp_dst = gallery + '/' + dir_to_copy + '/'
                shutil.copytree(tmp_src, tmp_dst)
            for dir_to_update in common_dirs:
                tmp_src = local_directory + '/' + dir_to_update + '/'
                tmp_dst = gallery + dir_to_update + '/'
                comp_dir = dircmp(tmp_src, tmp_dst).left_only
                for file in comp_dir:
                    tmp_file_src = tmp_src + file
                    if not os.path.isdir(tmp_file_src):
                        shutil.copy(tmp_file_src, tmp_dst)
        except Exception as e:
            sst_syslog.make_error_entry(f'Update Photo Files Exception: {e.args}')
            sst_syslog.make_error_entry(f'  -- Dir Source: {tmp_src}')
            sst_syslog.make_error_entry(f'  -- Dir Dest: {tmp_dst}')
            sst_syslog.make_error_entry(f'  -- FIle Source: {tmp_file_src}')
            raise e

    @staticmethod
    def extract_sql_from_wp_db(db_zip, table):
        try:
            with gzip.open(db_zip, 'rb') as f:
                file_content = f.read()
                file_content = file_content.decode('utf-8')
        except Exception as e:
            sst_syslog.make_error_entry(f'Error Unziping file: {db_zip} -- Error: {e.args}')
            raise e
        find_string = f'# Table: `{table}`'
        end_string = '# End of data contents of table'
        start = file_content.find(find_string)
        if start != -1:
            end = file_content.find(end_string, start)
            if end != -1:
                sql = file_content[start: end+1]
            else:
                sql = file_content[start:]
        sql = sql.replace('\n', '')
        return sql

    def import_wp_photo_db_tables(self, db_zip):
        try:
            sql = ManagePhotoFiles.extract_sql_from_wp_db(db_zip, 'wp_ngg_gallery')
            self.db_exec.db_session.execute(sql)
            sql = ManagePhotoFiles.extract_sql_from_wp_db(db_zip, 'wp_ngg_pictures')
            self.db_exec.db_session.execute(sql)
            self.db_exec.db_session.commit()
        except Exception as e:
            sst_syslog.make_error_entry(f'Importing wp_page_table: {e.args}')
            raise e


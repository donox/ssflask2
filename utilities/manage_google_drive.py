from utilities.run_log_command import run_interactive_shell_command as run_shell_cmd
from utilities.run_log_command import run_shell_command
from utilities.run_log_command import pexpect_script_mysql_run_script as mysql_script
from utilities.miscellaneous import copytree
import shutil
import gzip
import syslog
from db_mgt.db_exec import DBExec
import os
import datetime as dt
from zipfile import ZipFile
from config import Config
from utilities.miscellaneous import mergefolders



# import pandas as pd

# cmd_rclone = 'rclone -v copyto {} gdriveremote:/RClone/{}'
# cmd_save_sst_files = "rclone -v copy {} 'gdriveremote:/Sunnyside Times/SST Admin/{}'"
# cmd_get_sst_files = "rclone -v copy 'gdriveremote:/Sunnyside Times/SST Admin/{}' {}"

# RClone config file in /home/don/.config/rclone/rclone.conf


class ManageGoogleDrive(object):
    def __init__(self):
        self.db_exec = DBExec()
        self.cmd_list_files = r"rclone ls 'gdriveremote:/"
        self.cmd_download_file = r"rclone -v copy 'gdriveremote:/{}' {}"
        self.cmd_download_csv_file = "rclone -v --drive-formats csv copy \'gdriveremote:/\'{} {}"
        self.cmd_download_dir = "rclone -v {} copy \'gdriveremote:/{}\' {}"

    def list_directory(self, dir_path):
        """Get directory for specified path."""
        dir_to_list = self.cmd_list_files + dir_path + "'"
        res, err = run_shell_command(dir_to_list, return_result=True)
        if not err:
            return res
        else:
            err_string = f'List directory on Google Drive failed with error: {err}'
            self.db_exec.add_error_to_form('Google Drive', err_string)
            raise ValueError(err_string)

    def download_file(self, dir_path, filename, target_dir):
        """Download specific file to the target directory with the same name.

        Args:
            dir_path: path to directory on Google Drive
            filename: name of file to be downloaded
            target_dir: str: the full path to the target directory

        Returns:
            boolean indicating success/failure
        """
        if not os.path.isdir(target_dir):
            self.db_exec.add_error_to_form('Google Drive', f'{target_dir} is not a directory.')
            return False
        if dir_path[-1] != '/':
            dir_path += '/'
        download_cmd = self.cmd_download_file.format(dir_path + filename, target_dir)
        succeed = run_shell_command(download_cmd)
        if not succeed:
            err_string = f'List directory on Google Drive failed with error: {succeed}'
            self.db_exec.add_error_to_form('Google Drive', err_string)
            return False
        return True

    def download_csv_file(self, file, download_dir, dummy_source=None):
        '''Download Google Spreadsheet as csv file.'''
        try:
            if dummy_source:
                shutil.copy(dummy_source, download_dir)
            else:
                download_files_cmd = self.cmd_download_csv_file.format(file, download_dir)
                run_shell_command(download_files_cmd)
        except Exception as e:
            syslog.make_error_entry('Error downloading spreadsheet {}'.format(file))
            raise e

    def identify_most_recent_backup_files(self):
        dir_path = self.cmd_list_files + 'UpdraftPlus/\''
        res, err = run_shell_command(dir_path, return_result=True)
        if err:
            syslog.make_error_entry('Error Listing Backup Directory')
            raise ValueError('Error listing backup directory')
        res = res.decode("utf-8")
        res = res.split('\n')
        split_res = []
        for path in res:
            split_res.append(path.strip().split(' ', 1))
        most_recent_date = dt.datetime(2000, 1, 1)
        file_ndx = 0
        for ndx, file in enumerate(split_res):
            if len(file) > 1:
                pieces = file[1].split('_')
                dl = pieces[1].split('-')
                backup_date = dt.datetime(int(dl[0]), int(dl[1]), int(dl[2]))
                if backup_date > most_recent_date:
                    most_recent_date = backup_date
                    file_ndx = ndx
        base_string = split_res[file_ndx][1][0:30]  # No magic in '30' just include date
        most_recent_backups = []
        for file in split_res:
            if len(file) > 1:
                if file[1][0:30] == base_string:
                    most_recent_backups.append(file)
        return most_recent_backups

    def _download_backup_file(self, file_dir, file):
        if not os.path.isfile(file_dir + file):
            download_cmd = self.cmd_download_file.format('UpdraftPlus/' + file, file_dir)
            succeed = run_shell_command(download_cmd)
            if not succeed:
                self.db_exec.add_error_to_form('Save Backup File', f'Failed on file: {file}')
                return False
        return True

    def _extract_sql_table(self, sql_path, table):
        with open(sql_path, 'r') as f:
            sql_all = f.read()
            start = f"# Table: `{table}`"
            start_loc = sql_all.find(start)
            if start_loc == -1:
                return None
            end = r"# End of data contents of table"
            end_loc = sql_all[start_loc:].find(end)
            if end_loc == -1:
                return None
            return sql_all[start_loc: end_loc]

    def _find_sql_tables(self, sql_all):
        not_done = True
        nxt_start = 0
        results = []
        while not_done:
            nxt_pos = sql_all[nxt_start:].find(f"# Table: `")
            if nxt_pos != -1:
                nxt_pos += nxt_start+10
                nxt_end = sql_all[nxt_pos:].find(f"`")
                table = sql_all[nxt_pos:nxt_pos+nxt_end]
                if table.startswith('wp_srcp'):
                    foo = 3
                table_end = sql_all[nxt_pos:].find(r"# End of data contents of table")
                table_sql = sql_all[nxt_start: nxt_pos+table_end]
                results.append((table, table_sql))
                print(table, nxt_pos, nxt_pos+table_end)
                nxt_start += table_end
            else:
                not_done = False
        return results


    def download_backup(self, save_directory, db_only=False, install_backup=False):
        """Download most recent backup."""
        backup_to_use = self.identify_most_recent_backup_files()
        if not os.path.isdir(save_directory):
            self.db_exec.add_error_to_form('Save Directory', f'No such directory: {save_directory}')
            return False
        file_dir = 'backup_of_' + backup_to_use[0][1].split('_')[1] + '/'
        if save_directory[-1] != '/':
            file_dir = save_directory + '/' + file_dir
        else:
            file_dir = save_directory + file_dir
        if not os.path.isdir(file_dir):
            os.mkdir(file_dir)
        if not install_backup:
            for _, file in backup_to_use:
                if not db_only or file.split('-')[-1] == 'db.gz':
                    if not os.path.isdir(file_dir + file):
                        download_cmd = self.cmd_download_file.format('UpdraftPlus/' + file, file_dir)
                        succeed = run_shell_command(download_cmd)
                        if not succeed:
                            self.db_exec.add_error_to_form('Save Backup File', f'Failed on file: {file}')
                            return False
        if install_backup:
            try:
                for _, file in backup_to_use:
                    file_kind = file.split('-')[-1]
                    local_path = file_dir + file
                    if file_kind == 'db.gz':
                        if self._download_backup_file(file_dir, file):
                            with gzip.open(local_path, 'rb') as f:
                                db_sql = f.read().decode('latin1')
                                # Updraft Fails to create a valid SQL import
                                db_sql = db_sql.replace("DEFAULT '0000-00-00 00:00:00", "DEFAULT '2000-01-01 00:00:00")
                                db_sql = db_sql.replace("\n", " ")
                                # with open('/home/don/Downloads/foobat.sql', 'w') as fl:
                                #     fl.write(db_sql)
                                #     fl.close()
                                # # This Command FAILS ----------------------------------------
                                # cmd = mysql_script()
                                # res = run_shell_cmd(cmd)
                                # foo = 3
                        else:
                            raise ValueError(f'Failed to download database file')
                    if file_kind.startswith('other'):
                        if self._download_backup_file(file_dir, file):
                            with ZipFile(file_dir + file, 'r') as zf:
                                zf.extractall(file_dir)
                            gallery = file_dir + '/gallery/'
                            if os.path.isdir(gallery):
                                mergefolders(gallery, Config.USER_DIRECTORY_IMAGES)
            except Exception as e:
                foo = 3

        return True

    def _copy_gallery_file(self, src, dst, *args, **kwargs):
        """Do not copy over existing files"""
        if os.path.exists(dst):
            return
        else:
            shutil.copy(src, dst, *args, **kwargs)

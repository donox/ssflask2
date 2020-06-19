from utilities.run_log_command import run_shell_command
from utilities.miscellaneous import copytree
import shutil
import syslog
from db_mgt.db_exec import DBExec
import os
# import pandas as pd

# cmd_rclone = 'rclone -v copyto {} gdriveremote:/RClone/{}'
# cmd_save_sst_files = "rclone -v copy {} 'gdriveremote:/Sunnyside Times/SST Admin/{}'"
# cmd_get_sst_files = "rclone -v copy 'gdriveremote:/Sunnyside Times/SST Admin/{}' {}"

# RClone config file in /home/don/.config/rclone/rclone.conf


class ManageGoogleDrive(object):
    def __init__(self):
        self.db_exec = DBExec()
        self.cmd_list_files = r"rclone ls 'gdriveremote:/"
        self.cmd_download_file = r"rclone -vv copy 'gdriveremote:/{}' {}"
        self.cmd_download_csv_file = "rclone -v --drive-formats csv copy \'gdriveremote:/\'{} {}"
        self.cmd_download_dir = "rclone -v {} copy \'gdriveremote:/{}\' {}"

    def list_directory(self, dir_path):
        """Get directory for specified path."""
        dir_to_list = self.cmd_list_files + dir_path + "'"
        res, err = run_shell_command(dir_to_list,  return_result=True)
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
        self.download_csv_file(dir_path, filename)
        if not os.path.isdir(target_dir):
            self.db_exec.add_error_to_form('Google Drive', f'{target_dir} is not a directory.')
            return False
        if dir_path[-1] != '/':
            dir_path += '/'
        download_cmd = self.cmd_download_file.format(dir_path + filename, target_dir)
        err = run_shell_command(download_cmd)
        if not err:
            return True
        else:
            err_string = f'List directory on Google Drive failed with error: {err}'
            self.db_exec.add_error_to_form('Google Drive', err_string)
            return False

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

    # def download_directory(self, logger, dir_to_download, target_dir, as_type=None, dummy_source=None):
    #     """Download contents of specified directory to local directory.
    #     """
    #     try:
    #         if dummy_source:
    #             copytree(dummy_source, target_dir)
    #             convert_directory_to_csv(target_dir)
    #         else:
    #             parm = ''
    #             if as_type:
    #                 parm = '--drive-formats ' + as_type
    #             download_files_cmd = self.cmd_download_dir.format(parm, dir_to_download, target_dir)
    #             run_shell_command(download_files_cmd, logger)
    #     except Exception as e:
    #         logger.make_error_entry('Error downloading file directory {}'.format(dir_to_download))
    #         raise e


# def convert_directory_to_csv(src):
#     '''Convert directory of spreadsheets to csv and delete originals'''
#     for item in os.listdir(src):
#         s = os.path.join(src, item)
#         fn, tp = item.split('.')
#         d = os.path.join(src, fn + '.csv')
#         if tp == 'xls' or tp == 'xlsx' or tp == 'ods':
#             data_xls = pd.read_excel(s, None, index_col=None)
#             df = data_xls[list(data_xls)[0]]
#             df.to_csv(d, encoding='utf-8', index=False)
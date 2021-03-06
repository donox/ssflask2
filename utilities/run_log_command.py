import shlex
import logging
import subprocess
from ssfl import sst_syslog
from pexpect import spawn, EOF, TIMEOUT
from config import Config


class OvernightLogger(object):
    def __init__(self, log_name, log_directory):
        self.logger = logging.getLogger(log_name)
        self.logger.setLevel(logging.INFO)
        # create file handler which logs even debug messages
        fh = logging.FileHandler(log_directory + log_name + '.log')
        fh.setLevel(logging.INFO)
        # create console handler with a higher log level
        ch = logging.StreamHandler()
        ch.setLevel(logging.ERROR)
        # create formatter and add it to the handlers
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        ch.setFormatter(formatter)
        # add the handlers to the logger
        self.logger.addHandler(fh)
        self.logger.addHandler(ch)

    def make_info_entry(self, entry):
        self.logger.info(entry)

    def make_error_entry(self, entry):
        self.logger.error(entry)

    def close_logger(self):
        self.logger = None


def run_shell_command(command_line, return_result=False, outfile=False):
    command_line_args = shlex.split(command_line)
    cmd = command_line_args[0]
    sst_syslog.make_info_entry('Subprocess: {}'.format(command_line))

    try:
        command_line_process = subprocess.Popen(
            command_line_args,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )

        process_output, process_error = command_line_process.communicate()
        status = subprocess.getstatusoutput(cmd)
        if outfile:
            with open(outfile, 'wb') as fl:
                fl.write(process_output)

        sst_syslog.make_info_entry(process_output)
        sst_syslog.make_info_entry(process_error)
        if return_result:
            return process_output, process_error
    except (OSError, subprocess.CalledProcessError) as exception:
        sst_syslog.make_error_entry('Exception occurred in {}: {}'.format(cmd, exception))
        sst_syslog.make_error_entry('Subprocess {} failed'.format(cmd))
        return False
    else:
        # no exception was raised
        if process_error:
            sst_syslog.make_error_entry(f'Error returned from rclone: {process_error}')
            return False
        else:
            sst_syslog.make_info_entry('Subprocess {} completed'.format(cmd))
            return True


def run_interactive_shell_command(command_list, logfile=False):
    """Subprocess driver using Pexpect.

    Args:
        command_list: List of alternating commands and responses suitable for pexpect
                            (note that list length is an odd number)
        logfile: Open file-like object for writing
    Returns:
        None
    """
    child = spawn(command_list[0], encoding='utf-8', logfile=logfile, timeout=20)
    nxt_exchange = 1
    while len(command_list) > nxt_exchange + 1:
        ndx = child.expect([command_list[nxt_exchange], EOF, TIMEOUT])
        if ndx > 0:
            logfile.write(child.before)
            child.close()
            return
        nxt_exchange += 1
        child.sendline(command_list[nxt_exchange])
        nxt_exchange += 1
    sst_syslog.make_info_entry(f'Pexpect spawn: {command_list[0]}')
    child.close()

def pexpect_script_mysql_run_sql_script(script_to_run):
    """Create script to login to MySQL and run sql script.
 """
    script = []
    user = Config.SQLALCHEMY_USERNAME
    pswd = Config.SQLALCHEMY_PASSWORD
    db = Config.SQLALCHEMY_DATABASE_NAME
    cmd = f'mysql -u {user} -p {db} --default-character-set=utf8'
    script.append(cmd)
    expect = '[Ee]nter [Pp]assword: '
    script.append(expect)
    script.append(pswd)
    expect = '.*mysql> '
    script.append(expect)
    cmd = f"source {script_to_run};"
    script.append(cmd)
    script.append(expect)
    cmd = 'quit;'
    script.append(cmd)
    script.append(expect)
    return script



from test_base import BaseTestCase
from utilities.run_log_command import run_interactive_shell_command as ris
from utilities.run_log_command import pexpect_script_mysql_run_script
from utilities.miscellaneous import get_temp_file_name


class TestRunLogCommands(BaseTestCase):
    def setUp(self):
        script = []
        cmd = f"mysql --user=don --password=Luci2012  < '/home/don/Downloads/foobat.sql';"
        user = 'don'
        cmd = f'mysql -u {user} -p ssflask2 --default-character-set=utf8'
        script.append(cmd)
        expect = '[Ee]nter [Pp]assword: '
        script.append(expect)
        pswd = 'Luci2012'
        script.append(pswd)
        expect = '.*mysql> '
        script.append(expect)
        cmd = 'show databases;'
        script.append(cmd)
        script.append(expect)
        cmd = 'use ssflask2;'
        script.append(cmd)
        script.append(expect)
        cmd = 'select count(id) from sst_photos;'
        script.append(cmd)
        script.append(expect)
        cmd = 'quit;'
        script.append(cmd)
        script.append(expect)
        self.script = script

    def test_mysql_login(self):
        logfile = get_temp_file_name('testlog', 'log')
        with open(logfile, 'w') as lg:
            ris(self.script, logfile=lg)

    def test_db_restore(self):
        logfile = get_temp_file_name('testlog', 'log')
        script = pexpect_script_mysql_run_script()
        with open(logfile, 'w') as lg:
            ris(script, logfile=lg)




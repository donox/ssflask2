from test_base import BaseTestCase
from utilities.run_log_command import run_interactive_shell_command as ris


class TestRunLogCommands(BaseTestCase):
    def setUp(self):
        script = []
        cmd = f"mysql --user=don --password=Luci2012 --default-character-set=utf8 < '/home/don/Downloads/foobat.sql';"
        user = 'don'
        cmd = f'mysql -u {user} -p ssflask2 --default-character-set=utf8'
        script.append(cmd)
        expect = '[Ee]nter [Pp]assword: '
        script.append(expect)
        pswd = 'Luci2012'
        script.append(pswd)
        expect = '.*mysql> '
        cmd = 'show databases;'
        script.append(cmd)
        script.append(expect)
        # source = '/home/don/Downloads/foobat.sql'
        # cmd = f"source '{source}';"
        # script.append(cmd)
        self.script = script

    def test_mysql_login(self):
        ris(self.script)




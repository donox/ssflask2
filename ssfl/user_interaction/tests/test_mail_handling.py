from test_base import BaseTestCase, app
from ssfl.user_interaction.mail_handling import ManageMail
from db_mgt.db_exec import DBExec


class TestTemplateHandling(BaseTestCase):
    def setup(self):
        pass

    def test_send_mail(self):
        mail_mgr = ManageMail()
        mail_mgr.add_content('Now is the time')
        mail_mgr.add_recipients(['don@theoxleys', 'donoxley@gmail.com'])
        mail_mgr.add_title('Test Mail Title')
        try:
            mail_mgr.send_message()
            foo = 3
        except Exception as e:
            foo = 3
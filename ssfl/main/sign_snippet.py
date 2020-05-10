from db_mgt.db_exec import DBExec

class Sign(object):
    """The sign object represents a simple item for display such as a notice, alert, quote, photo, ...

    """
    def __init__(self, db_exec: DBExec):
        self.db_exec = db_exec
        self.sign_data = dict()
        self.json_mgr = db_exec.create_json_manager()

        self.sign_data['content'] = "THIS IS A NOTICE"

    def create_notice(self, text_content):
        self.sign_data['content'] = text_content


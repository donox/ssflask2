from db_mgt.db_exec import DBExec

class Sign(object):
    """The sign object represents a simple item for display such as a notice, alert, quote, photo, ...

    """
    foo = {"SIGN_SNIPPET": None, "node_name": "SIGN_SNIPPET", "name": None, "width": None,
                                      "height": None, "sign_type": None, "sign_background": None, "sign_border": None,
                                      "content": None, "styling": None}
    sign_types = ['Notice', 'Quote', 'Humor']
    sign_backgrounds = ['Solid', 'Gradient', 'Picture']
    sign_borders = ['Solid', 'Gradient']

    def __init__(self, db_exec: DBExec):
        self.db_exec = db_exec
        self.json_mgr = db_exec.create_json_manager()

    def create_notice(self, elem):
        sign_descriptor = self.json_mgr.get_json_from_name('f_sign_test')
        elem['content'] = sign_descriptor['content']
        elem['title'] = None


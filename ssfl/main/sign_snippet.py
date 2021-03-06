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
        result = dict()
        sign_descriptor = self.json_mgr.get_json_from_name('f_sign_test')
        result['content'] = sign_descriptor['content']
        result['title'] = None
        height = sign_descriptor.get('height', 75)
        if type(height) is str and height.isdigit():
            height = int(height)
        result['height'] = height
        border = sign_descriptor.get('border', 'Solid')
        if border not in Sign.sign_borders:
            border = 'Solid'
        result['sign-border'] = border
        background = sign_descriptor.get('background', 'Solid')
        if background not in Sign.sign_backgrounds:
            background = 'Solid'
        result['background'] = background
        styling = sign_descriptor.get('styling', 'margin-top: 12px')
        result['styling'] = styling
        return result


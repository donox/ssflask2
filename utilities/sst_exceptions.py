from ssfl import sst_syslog, sst_admin_access_log, wsgi_logger

def log_error(e, *args, **kwargs):
    """This is a generalized logging function to handle all sst_exceptions."""
    if issubclass(type(e), SSTException):
        if len(args) > 0:
            sst_syslog.make_error_entry(args[0])
        else:
            sst_syslog.make_error_entry(f'Error type: {type(e).__repr__}; no args provided')
    else:
        sst_syslog.make_error_entry(f'Unrecognized Exception Type: {type(e)}')
        sst_syslog.logging.exception("Unexpected Exception Type (this message in sst_exceptions")
        raise e


class SSTException(Exception):
    """Base Exception Class for All SsT exceptions."""
    pass


class DataMgtModuleError(SSTException):
    """Base Exception Class for Data Management module"""
    pass


class ShortcodeError(SSTException):
    """Base Exception Class for Shortcode module"""
    pass


class SsTFormError(SSTException):
    """Base Exception Class for errors associated with forms."""
    pass


class SsTDocParseError(SSTException):
    """Base Exception Class for errors associated with parsing Word Docs."""
    pass


# ######################################################
class RequestInvalidMethodError(SsTFormError):
    """Error raised for invalid methods for web request."""

    def __init__(self, obj_id, obj_type, msg):
        self.object_id = obj_id
        self.object_type = obj_type
        self.error_message = msg


class SiteObjectNotFoundError(DataMgtModuleError):
    """Error raised when a page, photo, or other site specific object is not found in database"""

    def __init__(self, obj_id, obj_type, msg):
        self.object_id = obj_id
        self.object_type = obj_type
        self.error_message = msg


class SiteUpdateError(DataMgtModuleError):
    """Error raised when update fails"""

    def __init__(self, obj_id, obj_type, sql_error_code, sql_error_msg):
        self.obj_id = obj_id
        self.object_type = obj_type
        self.error_message = sql_error_msg


class SiteIdentifierError(DataMgtModuleError):
    """Error raised when an invalid object identifier is received"""

    def __init__(self, obj_id, obj_type, msg):
        self.obj_id = obj_id
        self.object_type = obj_type
        self.error_message = msg


class ShortcodeParameterError(ShortcodeError):
    """Error raised when a shortcode contains an invalid parameter"""

    def __init__(self, obj_id, obj_type, msg):
        self.obj_id = obj_id
        self.object_type = obj_type
        self.error_message = msg

class ShortcodeSystemError(ShortcodeError):
    """Error raised when a shortcode processing fails improperly"""

    def __init__(self, obj_id, obj_type, msg):
        self.obj_id = obj_id
        self.object_type = obj_type
        self.error_message = msg


class DataEditingSystemError(ShortcodeError):
    """Error raised when a database data editing support processing fails improperly"""

    def __init__(self, obj_id, obj_type, msg):
        self.obj_id = obj_id
        self.object_type = obj_type
        self.error_message = msg


class WordLatexExpressionError(SsTDocParseError):
    """Error raised a parsing error occurs parsing a Latex style expression in a Word Document."""

    def __init__(self, msg):
        self.error_message = msg

class WordHTMLExpressionError(SsTDocParseError):
    """Error raised a parsing error occurs parsing HTML in a Word Document."""

    def __init__(self, msg):
        self.error_message = msg

class WordInputError(SsTDocParseError):
    """Error raised a parsing error occurs  in a Word Document."""

    def __init__(self, msg):
        self.error_message = msg


class DataMgtModuleError(Exception):
    """Base Exception Class for Data Management module"""
    pass


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


class ShortcodeError(Exception):
    """Base Exception Class for Shortcode module"""
    pass


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
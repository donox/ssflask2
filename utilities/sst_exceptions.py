from ssfl import sst_syslog
import traceback


def log_sst_error(exec_info, get_traceback=False):
    """This is a generalized logging function to handle all sst_exceptions."""
    cls, inst, trace = exec_info
    if issubclass(cls, SSTException):
        sst_syslog.make_error_entry(f'Exception of type: {cls} with message: {inst}')
        if get_traceback:
            sst_syslog.make_error_entry(f'Traceback: {traceback.print_tb(trace)}')
    else:
        sst_syslog.make_error_entry(f'Unrecognized Exception Type: {cls}')
        sst_syslog.logging.exception("Unexpected Exception Type (this message in sst_exceptions")


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

class SsTSystemError(SSTException):
    """Base Exception Class for errors associated with unexpected system failures."""
    pass

class SsTTOMLError(SSTException):
    """Base Exception Class for errors associated with handling TOML documents."""
    pass


# ######################################################
class PhotoHandlingError(SsTSystemError):
    """Error in resizing, removing temp files, loading photo from DB."""
    pass

class RequestInvalidMethodError(SsTFormError):
    """Error raised for invalid methods for web request."""
    pass


class SiteObjectNotFoundError(DataMgtModuleError):
    """Error raised when a page, photo, or other site specific object is not found in database"""
    pass


class SiteUpdateError(DataMgtModuleError):
    """Error raised when update fails"""
    pass


class SiteIdentifierError(DataMgtModuleError):
    """Error raised when an invalid object identifier is received"""
    pass


class ShortcodeParameterError(ShortcodeError):
    """Error raised when a shortcode contains an invalid parameter"""
    pass


class ShortcodeSystemError(ShortcodeError):
    """Error raised when a shortcode processing fails improperly"""
    pass


class DataEditingSystemError(ShortcodeError):
    """Error raised when a database data editing support processing fails improperly"""
    pass


class WordLatexExpressionError(SsTDocParseError):
    """Error raised a parsing error occurs parsing a Latex style expression in a Word Document."""
    pass


class WordHTMLExpressionError(SsTDocParseError):
    """Error raised a parsing error occurs parsing HTML in a Word Document."""
    pass


class WordInputError(SsTDocParseError):
    """Error raised when a parsing error occurs  in a Word Document."""
    pass


class WordRenderingError(SsTDocParseError):
    """Error raised when a error occurs rendering a parsed Word Document."""
    pass


class WordContentFeatureExists(SsTDocParseError):
    """Error raised when a specific content feature is added more than once as a single feature."""
    pass

class NoSuchTOMLItem(SsTTOMLError):
    """Error finding TOML item in JSON Tables"""
    pass


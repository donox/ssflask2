import urllib.parse as up
from db_mgt.page_tables import Page
import db_mgt.setup as su
from config import Config


def find_page_from_url(db_session, url_string):
    # TODO: determine if there are "dupes" in db (ending with '_d') and handle here if needed.
    u = up.urlparse(url_string)
    split_path = u.path.split('/')
    last_element = split_path[-1]
    if last_element == '' and len(split_path) > 1:          # Defend against url ending in '/'
        last_element = split_path[-2]
    if not last_element:
        if len(split_path) > 1:
            last_element = split_path[-2]
    if not last_element:
        raise ValueError('Invalid url: {}'.format(url_string))
    target_page = db_session.query(Page).filter(Page.page_name == last_element.lower()).first()
    return target_page


def find_download_from_url(url_string):
    """Create target url for download"""
    downloadable_types = ['pdf', 'pptx', 'docx', 'doc', 'xlsx', 'xls']
    u = up.urlparse(url_string.lower())
    split_path = u.path.split('/')
    last_element = split_path[-1]
    if last_element == '':
        return None         # Assume ill formed url
    this_type = last_element.split('.')[-1]
    if this_type not in downloadable_types:
        return None     # Don't recognize type
    if 'downloads' not in split_path:
        # TODO - Add plots as valid download directory??
        return None     # Not valid path request
    top = split_path.index('downloads')
    url = 'http://' + Config.SERVER_NAME + '/' + '/'.join(split_path[top:])
    return url
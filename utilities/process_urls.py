import urllib.parse as up
from db_mgt.page_tables import Page

# These are needed when running standalone
from pathlib import Path
from dotenv import load_dotenv
env_path = '/home/don/devel/ssflask/.env'
load_dotenv(dotenv_path=env_path)
import db_mgt.setup as su


def find_page_from_url(db_session, url_string):
    # TODO: determine if there are "dupes" in db (ending with '_d') and handle here if needed.
    u = up.urlparse(url_string)
    split_path = u.path.split('/')
    last_element = split_path[-1]
    if not last_element:
        if len(split_path) > 1:
            last_element = split_path[-2]
    if not last_element:
        raise ValueError('Invalid url: {}'.format(url_string))
    target_page = db_session.query(Page).filter(Page.page_name == last_element.lower()).first()
    return target_page


if __name__ == '__main__':
    session = su.create_session(su.get_engine())
    foo = find_page_from_url(session, 'x/y/z/bingo')
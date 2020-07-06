import csv
from ssfl.main.story import Story
from db_mgt.json_tables import JSONStorageManager as jsm
from ssfl.main.calendar_snippet import Calendar, calendar_audiences, calendar_categories
from ssfl.main.sign_snippet import Sign
from config import Config
import json
from typing import Dict, AnyStr, Any
from utilities.sst_exceptions import PhotoOrGalleryMissing
from ssfl import sst_syslog
from db_mgt.db_exec import DBExec
from desc_mgt.build_descriptors import Descriptors
from db_mgt.sst_photo_tables import SlideShow


class CellBuilder(object):
    """Manage creation, retrieval, caching of cells."""

    def __init__(self, db_exec: DBExec, cell_type: str, is_temp: bool = False):
        self.db_exec = db_exec
        self.is_temp = is_temp
        self.cell_type = cell_type
        self.descriptor = None
        self.context = dict()
        self.storage_manager = db_exec.create_json_manager()
        self.desc_manager = Descriptors()
        # We use two instances.  The db version is designed to capture (or provide) the
        # instance from/to the database.  Cell_descriptor is the version that is created, modified, etc. or returned.
        # In the case of updating the db copy, it is necessary to have access to both to allow copying
        # info from the db and also adding new info.  This also allows a fresh instance to be created
        # without requiring a trip to the database.
        self.cell_content_descriptor = self.desc_manager.load_descriptor_from_database(cell_type)
        self.cell_descriptor = self.desc_manager.load_descriptor_from_database('P_GRID_CELL')
        self.db_descriptor = None

    def _get_cell_from_database(self, slug=None, cell_id=None):
        """Get existing cell from database with either slug or id.

        Args:
            slug: slug for cell or None
            cell_id: id for cell or None

        Returns:
            Boolean - success/failure -side effect setting self.cell_descriptor with result
        """
        self.db_descriptor = self.storage_manager.get_json_record_by_name_or_id(cell_id, slug)
        if self.db_descriptor:
            self.db_content = json.loads(self.db_descriptor.content)
        else:
            self.db_content = None
        return self.db_descriptor is not None

    def _save_cell_descriptor(self, slug, overwrite=True):
        """Save or update/replace cell descriptor.

        Args:
            slug: slug under which the descriptor will be added to the database
            overwrite: True implies update or replace, even if it exists.

        Returns:
            Boolean - success/failure (including because it exists but overwrite is False)
        """
        if overwrite and not self.is_temp:
            self.storage_manager.delete_descriptor(slug)
        self.cell_descriptor['cell_content'] = self.cell_content_descriptor
        self.cell_descriptor['cell_slug'] = slug
        self.cell_descriptor['cell_type'] = self.cell_content_descriptor['node_name']
        if not self.is_temp:
            self.storage_manager.add_json(slug, self.cell_descriptor)

    def _populate_calendar_cell(self, event_count, categories=None, audiences=None):
        """Create calender cell.

        Args:
            event_count: number of events to include
            categories: list of categories to select, None is all
            audiences: list of audiences to select, None is all

        Returns:
            Boolean success/failure
            Updates cell descriptor in object.

        """
        calendar = Calendar(self.db_exec)
        cats = calendar_categories
        if not categories:
            cats = categories
        auds = calendar_audiences
        if not audiences:
            auds = audiences
        calendar.create_daily_plugin(event_count, categories=cats, audiences=auds)
        cal_data = calendar.get_calendar_snippet_data()
        self.cell_content_descriptor['element']['events'] = cal_data['events']      # Only need event list for snippet cell

    def manage_calendar_cell(self, slug='', update=False, event_count=0, categories=None, audiences=None):
        if update:
            self._get_cell_from_database(slug=slug)
            if not self.db_descriptor:
                self.db_exec.add_error_to_form('No calendar snippet', f'Calendar snippet {slug} does not exist.')
                return False
            # self.cell_content_descriptor['width'] = self.db_content['width']
        if event_count:
            self.cell_content_descriptor['event_count'] = event_count
        if categories:
            self.cell_content_descriptor['categories'] = categories
        if audiences:
            self.cell_content_descriptor['audiences'] = audiences
        self._save_cell_descriptor(slug, overwrite=True)

    def manage_sign_cell(self, slug='', update=False, sign_type=None, sign_text=None):
        # {"SIGN_SNIPPET": null, "node_name": "SIGN_SNIPPET", "name": null, "width": null, "height": null,
        #  "sign_type": null, "sign_background": null, "sign_border": null, "content": null, "styling": null,
        #  "descriptor": "SIGN_SNIPPET"}
        if update:
            self._get_cell_from_database(slug=slug)
            if not self.db_descriptor:
                self.db_exec.add_error_to_form('No Sign Entry', f'Sign element {slug} does not exist.')
                return False
            self.cell_content_descriptor['width'] = self.db_content['width']
        self.cell_content_descriptor['sign_type'] = sign_type
        self.cell_content_descriptor['content'] = sign_text
        self._save_cell_descriptor(slug, overwrite=True)

    def manage_story_cell(self, slug='', update=False, story=None, story_slug=None, snippet_photo=None):
        # {"STORY": null, "node_name": "STORY", "id": null, "title": null, "name": null, "author": null, "date": null,
        #  "content": null,  "descriptor": "STORY"}
        # We create the story here to allow for the possibility that it is already in the cell cache and we
        # can avoid creating it again.
        # The slug has a 'J$-' prefix.  We actually create two cells - the second with an 'S$-' prefix representing
        # a story snippet.
        if not slug.startswith('J$-'):
            raise SystemError(f'Slug: {slug} encountered building a story cell - missing "J$-" prefix')
        story.create_story_from_db(None, story_slug)
        self.cell_content_descriptor['content'] = story.get_body()
        self.cell_content_descriptor['title'] = story.get_title()
        self._save_cell_descriptor(slug)
        if not self.is_temp:            # can this test be removed - no such thing anymore.
            snip_slug = 'S$-' + slug[3:]
            self.cell_content_descriptor = self.storage_manager.make_json_descriptor('P_STORY_SNIPPET')
            self.cell_content_descriptor['content'] = story.create_snippet()
            self.cell_content_descriptor['read_more'] = story.get_read_more()
            if snippet_photo.isdigit():
                photo_id = int(snippet_photo)
            else:
                photo_mgr = self.db_exec.create_sst_photo_manager()
                photo = photo_mgr.get_photo_from_slug(snippet_photo)
                photo_id = photo.id
            ss = SlideShow(None, self.db_exec)
            ss.add_photo(photo_id)
            html = ss.get_html()
            self.cell_content_descriptor['photo'] = html
            self._save_cell_descriptor(snip_slug)



    def manage_slideshow_cell(self, slug='', update=False, slideshow=None, slideshow_slug=None):
        if not slideshow:
            json_mgr = self.db_exec.create_json_manager()
            slides = json_mgr.get_json_from_name(slideshow_slug)
            if not slides:
                return None
        else:
            slides = slideshow
        # We already have a valid slideshow descriptor, so we dont need the one created when CellBuilder was created.
        # Could there be a problem if slug is not ''?  We would be updating an existing slug, but apparently with
        # an exact copy
        self.cell_content_descriptor = slides
        self._save_cell_descriptor(slug)


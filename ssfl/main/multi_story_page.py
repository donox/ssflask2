import csv
from ssfl.main.story import Story
from db_mgt.photo_tables import Photo
from db_mgt.json_tables import JSONStorageManager as jsm
from ssfl.main.calendar_snippet import Calendar
from config import Config
from json import dumps
from typing import Dict, AnyStr, Any


class MultiStoryPage(object):
    """Populate page containing multiple items specified by a JSON descriptor."""
    """
     Route: '/main/main' => multi_story_page
     Template: main.jinja2
     Form: 
     Processor: multi_story_page.py
    """
    def __init__(self, db_exec):
        self.db_exec = db_exec
        self.descriptor = None
        self.context = dict()
        self.storage_manager = jsm(db_exec)
        self.photo_manager = db_exec.create_photo_manager()

    def make_descriptor_from_csv_file(self, file):
        """Create a descriptor corresponding to a formatted spreadsheet.

        See otherfiles/FrontPageLayout.ods for sample page layout.

        Args:
            file: File in csv format with layout as specified above.

        Returns:    None (saves descriptor in self).

        """
        self.descriptor = jsm.make_json_descriptor('Page', jsm.descriptor_page_layout)
        with open(Config.USER_DEFINITION_FILES + 'front_page_layout.csv', 'r') as fl:
            layout = csv.reader(fl)
            self._set_descriptor_from_csv(layout)

    def make_descriptor_from_story_id(self, page_id: int, width: int) -> Dict[AnyStr, Any]:
        """Make descriptor for a single (specific) story.

        Args:
            page_id: Id of page in database.
            width: Width of story in columns (1-12)

        Returns: JSON descriptor - suitable for expanding with actual story content

        """
        self.descriptor = jsm.make_json_descriptor('Page', jsm.descriptor_page_layout)
        row_descriptor = jsm.make_json_descriptor('Row', jsm.descriptor_row_layout)
        self.descriptor['rows'] = [row_descriptor]
        column_descriptor = jsm.make_json_descriptor('Column', jsm.descriptor_column_layout)
        row_descriptor['columns'] = [column_descriptor]
        cell_descriptor = jsm.make_json_descriptor('Cell', jsm.descriptor_cell_layout)
        column_descriptor['cells'] = [cell_descriptor]
        self.descriptor['cells'] = [cell_descriptor]
        cell_descriptor['width'] = width
        cell_descriptor['element_type'] = 'FullStory'
        story_descriptor = jsm.make_json_descriptor('Story', jsm.descriptor_story_fields)
        cell_descriptor['element'] = story_descriptor
        story_descriptor['id'] = page_id                                            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        return story_descriptor

    def load_descriptor_from_database(self, name: str) -> Dict[AnyStr, Any]:
        """Get descriptor of specific name from database

        Args:
            name: str - descriptor name

        Returns:    JSON descriptor

        """
        self.descriptor = self.storage_manager.make_json_descriptor(self.storage_manager.get_json_from_name(name))

    def _set_descriptor_from_csv(self, layout):
        """Read descriptor for front page from csv file and build layout.

        Args:
            layout: csv file:   Description of content of front page.

        Returns:
            None
        """
        # descriptor_photo_fields = ['id', 'url', 'title', 'caption', 'width', 'height', 'alignment', 'alt_text',
        #                            'css_style',
        #                            'css_class', 'title_class', 'caption_class', 'image_class']
        # descriptor_story_fields = ['id', 'title', 'name', 'author', 'date', 'content', 'snippet']
        # descriptor_page_layout = ['name', 'row_count', 'column_count', 'rows', 'cells']
        # descriptor_row_layout = ['columns']
        # descriptor_column_layout = ['cells']
        # descriptor_cell_layout = ['element_type', 'element', 'width']
        # descriptor_story_snippet_fields = ['id', 'title', 'name', 'author', 'date', 'snippet', 'photo', 'story_url']
        # descriptor_calendar_snippet_fields = ['events', 'event_count']
        # descriptor_event_snippet_fields = ['name', 'date', 'time', 'venue']
        try:
            self.descriptor['rows'] = []
            self.descriptor['cells'] = []
            for row in layout:
                cmd = row[0].lower()
                if cmd == 'end':
                    return
                elif cmd == 'roworg':
                    widths = [int(x) for x in row[2].split(',')]
                    this_row_descriptor = jsm.make_json_descriptor('Row', jsm.descriptor_row_layout)
                    this_row_descriptor['columns'] = []
                    self.descriptor['rows'].append(this_row_descriptor)
                    for i, width in enumerate(widths):
                        # here only 1 cell in a column
                        this_column_descriptor = jsm.make_json_descriptor('Column', jsm.descriptor_column_layout)
                        this_row_descriptor['columns'].append(this_column_descriptor)
                        this_cell_descriptor = jsm.make_json_descriptor('Cell', jsm.descriptor_cell_layout)
                        this_column_descriptor['cells'] = [this_cell_descriptor]
                        self.descriptor['cells'].append(this_cell_descriptor)
                        this_cell_descriptor['width'] = width
                elif cmd == 'story':
                    # Select row and column in row - this is the dictionary for a specific cell
                    photo_descriptor = jsm.make_json_descriptor('Photo', jsm.descriptor_picture_fields)
                    snippet_descriptor = jsm.make_json_descriptor('StorySnippet', jsm.descriptor_story_snippet_fields)
                    snippet_descriptor['photo'] = photo_descriptor
                    rw = int(row[1]) - 1
                    cl = int(row[2]) - 1
                    cell_descriptor = self.descriptor['rows'][rw]['columns'][cl]['cells'][0]
                    cell_descriptor['element_type'] = 'StorySnippet'
                    cell_descriptor['element'] = snippet_descriptor
                    snippet_descriptor['name'] = row[3]
                    # Note:  The photo_descriptor does not create the actual photo - that is created when the browser
                    #        requests the photo, so this provides the proper url, etc.
                    photo_descriptor['id'] = row[4]
                    photo_descriptor['caption'] = row[7]
                    photo_descriptor['alignment'] = row[6]
                    pic_shape = [int(x) for x in row[5].split(',')]
                    photo_descriptor['width'] = pic_shape[0]
                    photo_descriptor['height'] = pic_shape[1]
                elif cmd == 'calendar':
                    calendar_snippet = jsm.make_json_descriptor('Calendar', jsm.descriptor_calendar_snippet_fields)
                    calendar_snippet['events'] = []
                    calendar_snippet['event_count'] = 6  # TODO:  move to config or user spec
                    rw = int(row[1]) - 1
                    cl = int(row[2]) - 1
                    cell_descriptor = self.descriptor['rows'][rw]['columns'][cl]['cells'][0]
                    cell_descriptor['element_type'] = 'CalendarSnippet'
                    cell_descriptor['element'] = calendar_snippet
                else:
                    raise ValueError('Unrecognized Command: {}'.format(cmd))
            raise ValueError('Fell off end of loop')
        except Exception as e:
            print('Exception in _set_descriptor:{}'.format(e.args))
            raise e

    def get_page_context(self):
        self.context['snips'] = self.descriptor
        return self.context

    def get_descriptor_as_string(self) -> str:
        """Returns current descriptor (in this object) as a string suitable for storing in DB.

        Returns: str - JSON dump of descriptor

        """
        res = dumps(self.descriptor)
        return res

    # descriptor_photo_fields = ["id", "url", "title", "caption", "width", "height", "alignment", "alt_text",
    #                            "css_style", "css_class", "title_class", "caption_class", "image_class"]
    # descriptor_story_fields = ["id", "title", "name", "author", "date", "content", "snippet"]
    # descriptor_page_layout = ["name", "row_count", "column_count", "rows", "cells"]

    def _fill_full_story(self, elem):
        """Build story from DB entry and populate descriptor."""
        # descriptor_story_fields = ["id", "title", "name", "author", "date", "snippet",
        # "photo", "story_url", "content", "read_more"]
        width = 12  # TODO: determine correct input
        page_name = None
        page_id = None
        if 'name' in elem:
            page_name = elem['name']   # will use which ever is set
        if 'id' in elem:                                                         # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            page_id = elem['id']                                                     # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        story = Story(self.db_exec, width)
        story.create_story_from_db(page_id= page_id, page_name=page_name)
        elem['title'] = story.get_title()
        elem['content'] = story.get_body()

    def _fill_photo_descriptor(self, elem):
        """Build picture descriptor from single photo in DB"""
        # descriptor_photo_fields = ["id", "url", "title", "caption", "width", "height", "alignment",
        #                   "alt_text", "css_style", "css_class", "title_class", "caption_class", "image_class"]
        # already defined:  "id", "caption" (unless overridden), "alignment", "width", "height"
        #
        # Note:  This photo_descriptor implicitly assumes that the ID was created in the descriptor such as a page
        #        loaded from the DB. This is equivalent to creating a Photo object and then calling
        #        the get_json_descriptor on it.
        photo_id = elem['id']
        photo = self.photo_manager.get_photo_from_id(photo_id)
        if not photo:
            raise ValueError(f'No photo with id: {photo_id}')
        if not elem['caption']:
            elem['caption'] = photo.caption
        elem['url'] = self.photo_manager.get_photo_url(photo_id)
        elem['alt_text'] = photo.alt_text

    def _fill_story_snippet(self, elem):
        """Fill story snippet descriptor."""
        # descriptor_story_snippet_fields = ["id", "title", "name", "author", "date", "snippet",
        # "photo", "story_url", "content", "read_more"]
        width = 3  # TODO: determine correct input
        id_val = elem['id']
        page_name = elem['name']
        story = Story(self.db_exec, width)
        if id_val:
            story.create_story_from_db(page_id=id_val)
        else:
            story.create_story_from_db(page_name=page_name)
        elem['title'] = story.get_title()
        elem['snippet'] = story.create_snippet()
        elem['content'] = story.get_body()
        self._fill_photo_descriptor(elem['photo'])
        elem['read_more'] = story.get_read_more()

    def _fill_calendar_snippet(self, elem):
        """Fill calendar event snippet."""
        # {"CALENDAR_SNIPPET": None, "events": [], "event_count": None, "width": None,
        #  "audience": [], "categories": []}
        ev_count = elem['event_count']
        calendar = Calendar(self.db_exec, elem['width'])
        calendar.create_daily_plugin(elem['event_count'])
        content = calendar.get_calendar_snippet_data()
        elem['events'] = content['events']


    def make_multi_element_page_context(self) -> Dict[AnyStr, Any]:
        """Create context for a page based on current descriptor.

        Returns:    JSON descriptor suitable for rendering templates.

        """
        # descriptor_row_layout = ['columns']
        # descriptor_column_layout = ['cells', 'column_width']
        # descriptor_cell_layout = ['element_type', 'element', 'width']
        for i, row in enumerate(self.descriptor['PAGE']['rows']):
            for j, col in enumerate(row['ROW']['columns']):
                for k, cell in enumerate(col['cells']):
                    width = cell['width']
                    elem = cell['element']
                    if 'STORY_SNIPPET' in elem:
                        self._fill_story_snippet(elem)
                    elif 'STORY' in elem:
                        self._fill_full_story(elem)
                    elif 'CALENDAR_SNIPPET' in elem:
                        self._fill_calendar_snippet(elem)
        return self.descriptor

    def make_single_page_context(self, story: str) -> Dict[AnyStr, Any]:
        mgr = jsm(self.db_exec)
        res = mgr.make_json_descriptor(mgr.get_json_from_name('P_SINGLECELLROW'))
        res['ROW']['columns'][0]['cells'][0]['element'] = "S_STORY"
        res['ROW']['columns'][0]['cells'][0]['element_type'] = "STORY"
        partial_descriptor = mgr.make_json_descriptor(res)
        if story.isdigit():
            partial_descriptor['ROW']['columns'][0]['cells'][0]['element']['id'] = story
        else:
            partial_descriptor['ROW']['columns'][0]['cells'][0]['element']['name'] = story
        self.descriptor = {'PAGE': {'rows': [partial_descriptor]}}
        self.make_multi_element_page_context()
        return self.descriptor

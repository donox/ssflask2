import csv
from ssfl.main.story import Story
from db_mgt.photo_tables import Photo
from db_mgt.json_tables import JSONStorageManager as jsm
from config import Config
from .views.calendar_view import RandomCalendarAPI, get_random_events
from flask import render_template
from .calendar_snippet import Calendar
from json import dumps


class MultiStoryPage(object):
    def __init__(self, db_session):
        self.session = db_session
        self.descriptor = None
        self.context = dict()
        self.storage_manager = jsm(db_session)

    def make_descriptor_from_csv_file(self, file):
        self.descriptor = jsm.make_json_descriptor('Page', jsm.descriptor_page_layout)
        with open(Config.USER_DEFINITION_FILES + 'front_page_layout.csv', 'r') as fl:
            layout = csv.reader(fl)
            self._set_descriptor_from_csv(layout)

    def load_descriptor_from_database(self, name):
        self.descriptor = self.storage_manager.get_json_from_name(name)

    def _set_descriptor_from_csv(self, layout):
        """Read descriptor for front page and build layout.

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
                    photo_descriptor = jsm.make_json_descriptor('Photo', jsm.descriptor_photo_fields)
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

    def get_descriptor_as_string(self):
        res = dumps(self.descriptor)
        return res

    # descriptor_photo_fields = ['id', 'url', 'title', 'caption', 'width', 'height', 'alignment', 'alt_text', 'css_style',
    #                            'css_class', 'title_class', 'caption_class', 'image_class']
    # descriptor_story_fields = ['id', 'title', 'name', 'author', 'date', 'content', 'snippet']
    # descriptor_page_layout = ['name', 'row_count', 'column_count', 'rows', 'cells']

    def _fill_photo_descriptor(self, elem):
        # descriptor_photo_fields = ['id', 'url', 'title', 'caption', 'width', 'height', 'alignment',
        #                   'alt_text', 'css_style', 'css_class', 'title_class', 'caption_class', 'image_class']
        # already defined:  'id', 'caption' (unless overridden), 'alignment', 'width', 'height'
        photo_id = elem['id']
        # TODO: Needs to become Photo.id when photo tables are fully converted (or Story sets current id in descriptor)
        photo = self.session.query(Photo).filter(Photo.old_id == photo_id).first()
        if not photo:
            raise ValueError(f'No photo with id: {photo_id}')
        if not elem['caption']:
            elem['caption'] = photo.caption
        elem['url'] = photo.get_photo_url(self.session, photo_id)
        elem['alt_text'] = photo.alt_text


    def _fill_story_snippet(self, elem):
        # descriptor_story_snippet_fields = ['id', 'title', 'name', 'author', 'date', 'snippet',
        # 'photo', 'story_url', 'content', 'read_more']
        width = 3  # TODO: determine correct input
        id_val = elem['id']
        page_name = elem['name']
        story = Story(self.session, width)
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
        # descriptor_calendar_snippet_fields = ['events', 'event_count']
        # descriptor_event_snippet_fields = ['name', 'date', 'time', 'venue']
        ev_count = elem['event_count']
        for i in range(ev_count):
            event_desc = jsm.make_json_descriptor('Event', jsm.descriptor_event_snippet_fields)
            elem['events'].append(event_desc)
            event_desc['name'] = f'Event Number {i}'
            event_desc['date'] = '2001-01-01'
            event_desc['time'] = '13:00:00'
            event_desc['venue'] = 'Hickory Cove'

    def make_front_page_context(self):
        # descriptor_row_layout = ['columns']
        # descriptor_column_layout = ['cells', 'column_width']
        # descriptor_cell_layout = ['element_type', 'element', 'width']
        for i, row in enumerate(self.descriptor['rows']):
            for j, col in enumerate(row['columns']):
                for k, cell in enumerate(col['cells']):
                    el_type = cell['element_type']
                    elem = cell['element']
                    width = cell['width']
                    if el_type == 'StorySnippet':
                        self._fill_story_snippet(elem)
                    elif el_type == 'CalendarSnippet':
                        self._fill_calendar_snippet(elem)
        return self.descriptor

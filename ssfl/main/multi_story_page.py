import csv
from ssfl.main.story import Story
from db_mgt.json_tables import JSONStorageManager as jsm
from ssfl.main.calendar_snippet import Calendar
from config import Config
from json import dumps
from typing import Dict, AnyStr, Any
from utilities.sst_exceptions import PhotoOrGalleryMissing


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
        self.storage_manager = db_exec.create_json_manager()
        self.photo_manager = db_exec.create_sst_photo_manager()

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
        story_descriptor['id'] = page_id  # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
            page_name = elem['name']  # will use which ever is set
        if 'id' in elem:  # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            page_id = elem['id']  # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        story = Story(self.db_exec, width)
        story.create_story_from_db(page_id=page_id, page_name=page_name)
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
        if not photo_id:
            if 'slug' in elem:
                photo_id = elem['slug']
            else:
                raise PhotoOrGalleryMissing(f'Photo missing both id and slug')
        if type(photo_id) is str:
            photo = self.photo_manager.get_photo_from_slug(photo_id)
            photo_id = photo.id
        else:
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
        width = 6  # TODO: determine correct input
        id_val = page_name = None
        if 'id' in elem:
            id_val = elem['id']
        if 'name' in elem:
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
        calendar = Calendar(self.db_exec)
        calendar.create_daily_plugin(elem['event_count'])
        content = calendar.get_calendar_snippet_data()
        elem['events'] = content['events']

    def _fill_slideshow_snippet(self, elem):
        """Fill slideshow snippet.

        There are 2 cases:
            (1) The snippet is already constructed in which case there is a 'slides' element.
            (2) The descriptor is for a SLIDESHOW in which case the snippet element needs to
                be created and added.  In this case, there is a pictures element containing a
                list of picture identifies that need to be added to create a slideshow.
        """
        # {"SLIDESHOW_SNIPPET": None, "id": None, "title": None, "text": None,
        # "slides": {"SLIDESHOW": None, "title": None, "title_class": None, "position": None,
        #                                    "width": None, "height": None, "rotation": None,
        #                                    "frame_title": None, "pictures": []}}
        if elem['descriptor'] == 'SLIDESHOW_SNIPPET':
            pass
            # photo_list = elem['slides']['pictures']
        elif elem['descriptor'] == 'SLIDESHOW':
            # Need to convert this element to be a proper 'SLIDESHOW_SNIPPET'
            existing = elem.copy()
            snip = self.storage_manager.get_json_from_name('P_SLIDESHOW_SNIPPET')
            keys = [x for x in elem.keys()]  # this avoids the runtime error of dictionary size change during iterate
            for key in keys:
                del elem[key]
            for key, val in snip.items():
                elem[key] = val
            # Should have properly formatted snippet - now fill it in
            elem['title'] = existing['title']
            elem_show = elem['slides']
            # elem_show['title'] = existing['title']      # Displays as duplicate - are there reasons to have separate?
            elem_show['title_class'] = existing['title_class']
            elem_show['frame_title'] = existing['frame_title']  # Unneeded ??
            elem_show['position'] = existing['position']
            elem_show['width'] = existing['width']
            elem_show['height'] = existing['height']
            elem_show['rotation'] = existing['rotation']

            res = list()
            photo_list = existing['pictures'].split(',')
            for photo_ident in photo_list:
                pid = photo_ident.strip()
                if pid.isdigit():
                    photo = self.photo_manager.get_photo_from_id(int(pid))
                else:
                    photo = self.photo_manager.get_photo_from_slug(pid)
                photo_json = self.storage_manager.make_json_descriptor('PICTURE')
                photo_json['PICTURE']['id'] = photo.id
                photo_json['PICTURE']['url'] = self.photo_manager.get_photo_url(photo.id)
                photo_json['PICTURE']['caption'] = photo.caption
                photo_json['PICTURE']['alt_text'] = photo.alt_text
                res.append(photo_json['PICTURE'])
            elem_show['pictures'] = res
        else:
            raise SystemError(f'Unrecognized descriptor {elem["descriptor"]} when expecting a slideshow element')
        foo = 3

    def _fill_sign_snippet(self, elem):
        pass
        # content = elem['content']
        # name = elem['name']
        # content_type = elem['content_type']
        # styling = elem['styling']

    def make_multi_element_page_context(self) -> Dict[AnyStr, Any]:
        """Create context for a page based on current descriptor.

        Returns:    JSON descriptor suitable for rendering templates.

        """
        # descriptor_row_layout = ['columns']
        # descriptor_column_layout = ['cells', 'column_width']
        # descriptor_cell_layout = ['element_type', 'element', 'width', 'height']
        for i, row in enumerate(self.descriptor['PAGE']['rows']):
            # Remove use of ROW when everything is updated
            if 'ROW' in row:
                row_iter = row['ROW']['columns']
            else:
                row_iter = row['columns']
            for j, col in enumerate(row_iter):
                classes = ""
                width_in_column = False
                if 'width' in col:  # The cell is the container (not the column) so width control is here
                    width = col['width']
                    if width:
                        width_in_column = True
                        classes += f'col-sm-{width} col-md-{width} col-lg-{width}'
                col['classes'] = classes
                # Some classes (e.g, width) may be set in the cells and need to be promoted back here.
                # We collect them in col_extra_classes, then remove dupes and add to col['classes']
                col_extra_classes = ''
                for k, cell in enumerate(col['cells']):
                    styles = ""
                    # Width is properly a column attribute since there may be multiple cells.  However, the normal
                    # case is a single cell in a row-column and it is more natural to combine width/height in the
                    # same place and height is a cell property.  If specified at the column level it overrides.
                    # If not at the column level, the last cell spec wins.
                    if 'width' in cell and not width_in_column:
                        width = cell['width']
                        if width:
                            col_extra_classes += f'col-sm-{width} col-md-{width} col-lg-{width}'
                    if 'height' in cell:
                        height = cell['height']
                        if height:
                            styles += f'height:{height}px;'
                    cell['styles'] = styles
                    classes = ""
                    if 'overflow' in cell:          # overflow causes scrollbars if needed
                        overflow = cell['overflow']
                        if overflow:
                            classes += f' overflow-{overflow} '
                    if 'classes' in cell:
                        extra_classes = cell['classes']
                        if extra_classes:
                            classes += f' {extra_classes}'
                    cell['classes'] = classes
                    elem = cell['element']
                    if cell['is-snippet']:
                        if not elem:
                            pass
                        elif 'STORY' in elem:
                            self._fill_story_snippet(elem['snippet'])
                        elif 'STORY_SNIPPET' in elem:
                            self._fill_story_snippet(elem)
                        elif 'CALENDAR_SNIPPET' in elem:
                            self._fill_calendar_snippet(elem)
                        elif 'SLIDESHOW_SNIPPET' in elem:
                            self._fill_slideshow_snippet(elem)
                        elif 'SIGN_SNIPPET' in elem:
                            self._fill_sign_snippet(elem)
                        elif 'SLIDESHOW' in elem:       # This is converted to a Snippet in processing
                            self._fill_slideshow_snippet(elem)
                            cell['element_type'] = 'SLIDESHOW_SNIPPET'
                    else:
                        if 'STORY' in elem:
                            self._fill_full_story(elem)
                # Now add any extra column classes.  Note the use of set to remove dupes assumes that if multiple
                # cells provide conflicting classes, both will be rendered and the browser will take its choice
                if col_extra_classes:
                    cl_list = ' '.join(list(set(col_extra_classes.split())))
                    if col['classes']:
                        col['classes'] += ' ' + cl_list
                    else:
                        col['classes'] = cl_list
        return self.descriptor

    def make_single_page_context(self, story: str) -> Dict[AnyStr, Any]:
        mgr = self.storage_manager
        res = mgr.make_json_descriptor(mgr.get_json_from_name('P_SINGLECELLROW'))
        res['ROW']['columns'][0]['cells'][0]['element'] = "S_STORY"
        res['ROW']['columns'][0]['cells'][0]['element_type'] = "STORY"
        res['ROW']['columns'][0]['cells'][0]['is-snippet'] = False
        partial_descriptor = mgr.make_json_descriptor(res)
        if story.isdigit():
            partial_descriptor['ROW']['columns'][0]['cells'][0]['element']['id'] = story
        else:
            partial_descriptor['ROW']['columns'][0]['cells'][0]['element']['name'] = story
        self.descriptor = {'PAGE': {'rows': [partial_descriptor]}}
        self.make_multi_element_page_context()
        return self.descriptor

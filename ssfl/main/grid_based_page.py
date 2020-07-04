import csv
from ssfl.main.story import Story
from db_mgt.json_tables import JSONStorageManager as jsm
from ssfl.main.calendar_snippet import Calendar
from ssfl.main.sign_snippet import Sign
from config import Config
from json import dumps
from typing import Dict, AnyStr, Any
from utilities.sst_exceptions import PhotoOrGalleryMissing
from ssfl import sst_syslog
from db_mgt.db_exec import DBExec
from desc_mgt.build_descriptors import Descriptors


class GridBasedPage(object):
    """Populate grid page containing multiple items specified by a JSON descriptor."""
    """
     Route: '/main/main' => grid_based_page
     Template: main.jinja2
     Form: 
     Processor: grid_based_page.py
    """

    def __init__(self, db_exec: DBExec):
        self.db_exec = db_exec
        self.context = dict()
        self.storage_manager = db_exec.create_json_manager()
        self.photo_manager = db_exec.create_sst_photo_manager()
        self.desc_mgr = Descriptors()

    def make_multi_element_grid_page_context(self,  descriptor_slug=None):
        """Create context for a page based on current descriptor.

        Args:
            descriptor_slug:  Slug to PAGE_GRID entry in JSON_tables

        Returns:    JSON descriptor suitable for rendering templates.

        """
        page_grid = self.desc_mgr.load_descriptor_from_database(descriptor_slug)
        cells = page_grid['cells']
        res_list = []
        for cell_id in cells:
            el_name, el_slug = cell_id.popitem()        # Cell is single entry dictionary of name/slug
            cell = self.desc_mgr.load_descriptor_from_database(el_slug)
            res_list.append({el_name: cell})
            styles = ""
            # # Width is properly a column attribute since there may be multiple cells.  However, the normal
            # # case is a single cell in a row-column and it is more natural to combine width/height in the
            # # same place and height is a cell property.  If specified at the column level it overrides.
            # # If not at the column level, the last cell spec wins.
            # if 'width' in cell and not width_in_column:
            #     width = cell['width']
            #     if width:
            #         col_extra_classes += f'col-sm-{width} col-md-{width} col-lg-{width}'
            # height = cell.get('height', None)
            # if height:
            #     styles += f'max-height:{height}px;'
            cell['styles'] = styles
            classes = ''
            class_content = cell.get('classes', None)
            if class_content:
                if type(class_content) is list:
                    classes = ' '.join(class_content)
                else:
                    classes = class_content
            overflow = cell.get('overflow', None)  # overflow causes scrollbars if needed
            if overflow:
                classes += f' overflow-{overflow} '
            extra_classes = cell.get('classes', None)
            if extra_classes:
                classes += f' {extra_classes}'
            cell['classes'] = classes
            elem = cell['cell_content']
            if not elem:
                pass
            elif 'STORY' in elem:
                # self._fill_full_story(elem)
                pass
            elif 'STORY_SNIPPET' in elem:
                self._fill_story_snippet(elem)
            elif 'CALENDAR_SNIPPET' in elem:
                self._fill_calendar_snippet(elem)
            elif 'SLIDESHOW_SNIPPET' in elem:
                self._fill_carousel_snippet(elem)
            elif 'SIGN_SNIPPET' in elem:
                self._fill_sign_snippet(elem)
            elif 'CAROUSEL_SNIPPET' in elem:
                self._fill_carousel_snippet(elem)
            elif 'SLIDESHOW' in elem:  # This is converted to a Snippet in processing
                self._fill_carousel_snippet(elem)
                cell['element_type'] = 'CAROUSEL_SNIPPET'
            else:
                raise ValueError(f'Unrecognized grid_cell type')
            # Now add any extra column classes.  Note the use of set to remove dupes assumes that if multiple
            # cells provide conflicting classes, both will be rendered and the browser will take its choice
        return res_list



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

    def get_page_context(self):
        self.context['snips'] = self.descriptor
        return self.context

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
        if 'id' in elem:
            page_id = elem['id']
        story = Story(self.db_exec, width)
        story.create_story_from_db(page_id=page_id, page_name=page_name)
        elem['title'] = story.get_title()
        elem['content'] = story.get_body()

    def _fill_photo_base_descriptor(self, elem, photo):
        """Set classes used by photo_base.jinja2.

        css_class, photo_title_class, image_class, caption_class, do_rotation, title, caption, alignment

        Args:
            elem:  dict - JSON element describing photo
            photo: sst_photo object

        Returns:  None
        """
        if not elem['caption']:
            elem['caption'] = photo.caption
        if not 'caption_class' in elem:
            elem['caption_class'] = 'text-left font-weight-bold '
        if not 'image_class' in elem:
            elem['image_class'] = 'img-fluid rounded image-wrapper'
        if not 'photo_title_class' in elem:
            elem['photo_title_class'] = 'h4'
        if 'alignment' in elem:
            al = elem['alignment']
            if al:
                elem['alignment'] = 'float-' + al


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
        try:
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
                elem['url'] = ''
                elem['alt_text'] = 'Photo Not Found'
            else:
                elem['url'] = self.photo_manager.get_photo_url(photo_id)
                elem['alt_text'] = photo.alt_text
            self._fill_photo_base_descriptor(elem, photo)
        except Exception as e:
            elem['url'] = ''
            elem['alt_text'] = 'Photo Not Found'

    def _fill_carousel_snippet(self, elem):
        """Fill carousel snippet.

        There are 2 cases:
            (1) The snippet is already constructed in which case there is a 'slides' element.
            (2) The descriptor is for a CAROUSEL in which case the snippet element needs to
                be created and added.  In this case, there is a pictures element containing a
                list of picture identifiers that need to be added to create a carousel.
        """
        # {"CAROUSEL_SNIPPET": None, "node_name": "CAROUSEL_SNIPPET", "id": None,
        #  "title": None, "text": None, "slides": "S_CAROUSEL",
        #  "classes": ["carousel", "carousel-indicators", "carousel-caption"],
        #  "descriptor": "CAROUSEL_SNIPPET"}
        #
        # {"CAROUSEL": None, "node_name": "CAROUSEL", "title": None, "title_class": None,
        #  "position": None,
        #  "width": None, "height": None, "rotation": None,
        #  "frame_title": None, "pictures": []}
        if elem['descriptor'] == 'CAROUSEL_SNIPPET' or elem['descriptor'] == 'SLIDESHOW_SNIPPET':
            pass
            # photo_list = elem['slides']['pictures']
        elif elem['descriptor'] == 'CAROUSEL' or elem['descriptor'] == 'SLIDESHOW':
            # Need to convert this element to be a proper 'CAROUSEL_SNIPPET'
            existing = elem.copy()
            snip = self.storage_manager.get_json_from_name('P_CAROUSEL_SNIPPET')
            keys = [x for x in elem.keys()]  # this avoids the runtime error of dictionary size change during iterate
            for key in keys:
                del elem[key]
            for key, val in snip.items():    # Any values are defaults, override if provided
                elem[key] = val
            # Should have properly formatted snippet - now fill it in
            elem_show = elem['slides']
            items_to_copy = ['title', 'title_class', 'frame_title', 'position', 'width', 'height', 'rotation',
                             'background']
            for item in items_to_copy:
                if item in existing:
                    elem_show[item] = existing[item]
                else:
                    elem_show[item] = None
            # Rotation is in tenths of seconds - needs to be ms
            if 'rotation' in elem_show:
                elem_show['rotation'] *= 100
            res = list()
            if type(existing['pictures']) is int:
                photo_list = [str(existing['pictures'])]
            else:
                photo_list = existing['pictures'].split(',')
            for photo_ident in photo_list:
                pid = photo_ident.strip()
                if pid.isdigit():
                    photo = self.photo_manager.get_photo_from_id(int(pid))
                else:
                    photo = self.photo_manager.get_photo_from_slug(pid)
                photo_json = self.storage_manager.make_json_descriptor('PICTURE')
                if photo:
                    photo_json['PICTURE']['id'] = photo.id
                    photo_json['PICTURE']['url'] = self.photo_manager.get_photo_url(photo.id)
                    photo_json['PICTURE']['caption'] = photo.caption
                    photo_json['PICTURE']['alt_text'] = photo.alt_text
                    photo_json['PICTURE']['exists'] = True
                else:
                    photo_json['PICTURE']['exists'] = False
                res.append(photo_json['PICTURE'])
            elem_show['pictures'] = res
        else:
            raise SystemError(f'Unrecognized descriptor {elem["descriptor"]} when expecting a slideshow element')
        foo = 3

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

    def _fill_sign_snippet(self, elem):
        sign = Sign(self.db_exec)
        res = sign.create_notice(elem)
        elem['sign_snippet'] = res




    def make_single_page_context(self, story: str) -> Dict[AnyStr, Any]:
        self.descriptor = self.desc_mgr.make_single_page_story_descriptor(story)
        self.make_multi_element_page_context(descriptor=self.descriptor)
        return self.descriptor



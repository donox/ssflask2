import re
from utilities.process_urls import find_page_from_url, find_download_from_url
from config import Config
from db_mgt.sst_photo_tables import SlideShow
from utilities.miscellaneous import run_jinja_template
from utilities.sst_exceptions import ShortcodeError, ShortcodeParameterError, ShortcodeSystemError
from ssfl import sst_syslog


class Shortcode(object):
    """Handler for a single shortcode.

    """
    available_shortcodes = ['maxbutton', 'singlepic', 'src_singlepic', 'includeme', 'ngg_images']
    sc_re = re.compile(r'\[(\w+)( *.+)* *\]', re.I)
    sc_re_arg = re.compile(r'( *([A-Za-z0-9_]+) *= *"(.*)")+?')

    def __init__(self, db_exec, string_to_match=None):
        self.db_exec = db_exec
        self.specific_processors = {'maxbutton': self._process_maxbutton,
                                    'singlepic': self._process_singlepic,
                                    'src_singlepic': self._process_singlepic,
                                    'ngg_images': self._process_ngg_images,
                                    'includeme': self._process_include_me,
                                    'caption': None,  # see 'steve-and-david'  not sure where it comes from
                                    'src_lists_membership': None,
                                    'src_lists_admin': None
                                    }
        self.picture_processors = {'singlepic': self._process_findpic,
                                    'src_singlepic': self._process_findpic,
                                    'ngg_images': self._process_ngg_findpics,
                                    }
        self.shortcode_string = string_to_match
        self.content_dict = None
        self.page_mgr = db_exec.create_page_manager()
        self.photo_mgr = db_exec.create_sst_photo_manager()

    def parse_shortcode(self):
        # Does not handle case where shortcode has contained string "[xx] yy [/xx]"
        if not self.shortcode_string:
            return None
        matches = re.search(Shortcode.sc_re, self.shortcode_string)
        if matches is None or matches.groups() is None:
            raise ShortcodeSystemError('RE failed to match a shortcode.')
        res = dict()
        for n, match in enumerate(matches.groups()):
            if not n:
                res['shortcode'] = match.title().lower()
            if match:
                try:
                    # print("n: {}, {}".format(n, match.title()))
                    if n > 0:
                        arg_list = match.title()
                        loop_count = 50
                        while len(arg_list) > 0 and loop_count:         # Use loop_count to defend against infinite loop
                            try:
                                parm1, parm2, arg_list = self._get_next_arg(arg_list)
                                res[parm1.lower()] = parm2
                                loop_count -= 1
                            except:
                                print("No match arg on {}".format(arg_list))
                except:
                    print("No Match on {}".format(n))
        self.content_dict = res
        return res

    def _get_next_arg(self, arg_string):
        work = arg_string.strip()
        if work == '':
            return None
        eq_loc = str.find(work, '=')
        if eq_loc == -1:
            return None
        name = work[0:eq_loc]
        name = name.strip()
        st_arg_loc = str.find(work[eq_loc:], '"') + eq_loc + 1
        end_arg_loc = str.find(work[st_arg_loc:], '"')
        end_arg_pos = st_arg_loc + end_arg_loc
        arg = work[st_arg_loc: end_arg_pos]
        rem = work[end_arg_pos + 1:]
        return name, arg, rem

    def _get_parm_list(self, parm, expected_type):
        if parm in self.content_dict.keys():
            parm_list = self.content_dict[parm].split(',')
            try:
                return [expected_type(x) for x in parm_list]
            except TypeError as e:
                raise ShortcodeParameterError('Conversion Failure: {} is not of type {}'.format(parm_list,
                                                                                                str(expected_type)))

    def process_shortcode(self, pictures_only=False):
        if not self.content_dict:
            return None
        sc = self.content_dict['shortcode']
        if not pictures_only:
            if sc in self.specific_processors.keys():
                handler = self.specific_processors[sc]
                if handler:
                    handler()
        else:
            if sc in self.picture_processors.keys():
                handler = self.picture_processors[sc]
                if handler:
                    return handler()

    def _process_findpic(self):
        """Find photo id for relating photo to page"""
        photo_id = self.content_dict['id']
        if type(photo_id) is str:
            photo_id = int(photo_id)
        photo_id = self.photo_mgr.get_new_photo_id_from_old(photo_id)
        return [photo_id]

    def _process_ngg_findpics(self):
        """Find photo id's for relating photo to page"""
        keys = self.content_dict.keys()
        photo_ids = None
        if 'source' in keys:
            source = self.content_dict['source']
            if source.lower() == 'galleries':
                ids = self._get_parm_list('container_ids', int)
                photo_ids = set()
                for p_id in ids:
                    p_list = self._get_photo_list_by_gallery_id(p_id, old_id=True)
                    photo_ids = photo_ids.union(set(p_list))
            else:
                raise ShortcodeParameterError("{} is an invalid source for ngg_images".format(source))
        elif 'gallery_ids' in keys:
            ids = self._get_parm_list('gallery_ids', int)
            photo_ids = set()
            for p_id in ids:
                p_list = self._get_photo_list_by_gallery_id(p_id, old_id=True)
                photo_ids = photo_ids.union(set(p_list))
        elif 'image_ids' in keys:
            photo_ids = self._get_parm_list('image_ids', int)
        return list(photo_ids)

    def _process_maxbutton(self):
        try:
            button_type = self.content_dict['id']
            text_content = self.content_dict['text']
            url_content = self.content_dict['url']
        except KeyError as e:
            print("Maxbutton Key Error in dict: {}".format(self.content_dict))
            raise e
        try:
            target_page = find_page_from_url(self.db_exec, url_content)
            if target_page:
                page_id = target_page.id
                target = 'http://' + Config.SERVER_NAME + "/main/page/" + str(page_id)
            else:
                target = find_download_from_url(url_content)
                if not target:
                    return None  # TODO:  Is this really an error?  Displays as text content of shortcode
        except Exception as e:  # some urls seem to be bad
            print(f'Error in Maxbutton URL: {url_content}')
            return None
        button_type = "is-link"
        context_dict = {'button_type': button_type,
                        'extra_styling': 'margin:3px;',
                        'target': target,
                        'text_content': text_content}
        context = {'button': context_dict}
        res = run_jinja_template('base/button.jinja2', context=context).replace('\n', '')
        self.content_dict['result'] = res

    def _get_photo_list_by_gallery_id(self, gallery_id, old_id=False):
        photo_ids = self.photo_mgr.get_photo_ids_in_gallery_with_id(gallery_id, old_id=old_id)
        return photo_ids

    def _process_singlepic(self):
        try:
            photo_id = self.content_dict['id']
            if not photo_id:
                sst_syslog.make_error_entry(f'No photo ID to _process_singlepic')
                return None
            if type(photo_id) is str:
                photo_id = int(photo_id)
            photo_id = self.photo_mgr.get_new_photo_id_from_old(photo_id)
            photoframe = SlideShow('NO NAME', self.db_exec)
            photoframe.add_photo(photo_id)
            if 'h' in self.content_dict:
                photoframe.set_dimension('height', self.content_dict['h'])
            if 'w' in self.content_dict:
                photoframe.set_dimension('width', self.content_dict['w'])
            if 'title' in self.content_dict:
                photoframe.add_title(self.content_dict['title'])
            if 'align' in self.content_dict:
                photo_position = self.content_dict['align']
                if photo_position not in ['left', 'middle', 'right', 'top', 'bottom']:
                    sst_syslog.make_error_entry(f'Unknown photo position: {photo_position}')
                    photo_position = 'middle'
                photoframe.set_position(photo_position)
            res = photoframe.get_html()
            self.content_dict['result'] = res
        except Exception as e:
            # Capture error, but don't raise exception to avoid returning exception to end user
            sst_syslog.make_error_entry(f'Error occurred in _process_single_pic {e.args}')

    def _process_ngg_images(self):
        """Process Imagely shortcode ngg_images with relevant parameters."""
        # [ngg_images source = "galleries"
        # container_ids = "155"
        # display_type = "photocrati-nextgen_pro_slideshow"
        # image_crop = "1"
        # image_pan = "1"
        # show_playback_controls = "0"
        # show_captions = "1"
        # caption_class = "caption_overlay_bottom"
        # caption_height = "50"
        # aspect_ratio = "first_image"
        # width = "350"
        # width_unit = "px"
        # transition = "fade"
        # transition_speed = "1"
        # slideshow_speed = "5"
        # border_size = "0"
        # border_color = "#ffffff"
        # ngg_triggers_display = "always"
        # order_by = "imagedate"
        # order_direction = "ASC"
        # returns = "included"
        # maximum_entity_count = "500"]
        try:
            keys = self.content_dict.keys()
            if 'source' in keys:
                source = self.content_dict['source']
                if source.lower() == 'galleries':
                    ids = self._get_parm_list('container_ids', int)
                    photo_ids = set()
                    for p_id in ids:
                        p_list = self._get_photo_list_by_gallery_id(p_id, old_id=True)
                        photo_ids = photo_ids.union(set(p_list))
                else:
                    raise ShortcodeParameterError("{} is an invalid source for ngg_images".format(source))
            elif 'gallery_ids' in keys:
                ids = self._get_parm_list('gallery_ids', int)
                photo_ids = set()
                for p_id in ids:
                    p_list = self._get_photo_list_by_gallery_id(p_id, old_id=True)
                    photo_ids = photo_ids.union(set(p_list))
            elif 'image_ids' in keys:
                photo_ids = self._get_parm_list('image_ids', int)
            width = 0
            if 'width' in keys:
                width = int(self.content_dict['width'])
            if len(photo_ids) == 0:
                raise ShortcodeParameterError("No photo ids detected in shortcode")
            self.content_dict['photo_list'] = {}
            if len(photo_ids) == 1:
                for photo_id in photo_ids:  # retrieve single element from either list or set
                    break
            photoframe = SlideShow(None, self.db_exec)
            for p_id in photo_ids:
                photoframe.add_photo(p_id)
            if 'h' in keys:
                photoframe.set_dimension('height', self.content_dict['h'])
            if 'w' in keys:
                photoframe.set_dimension('width', self.content_dict['w'])
            if 'title' in keys:
                photoframe.add_title(self.content_dict['title'])
            if 'align' in keys:
                photo_position = self.content_dict['align']
                if photo_position not in ['left', 'middle', 'right', 'top', 'bottom']:
                    raise ValueError(
                        'Unknown photo position: {}'.format(photo_position))  # TODO: return error to script
                photoframe.set_position(photo_position)
            res = photoframe.get_html()
            self.content_dict['result'] = res

        except ShortcodeError as e:
            raise e

    def _process_include_me(self):
        """Process 'includeme' shortcode.
            Example: [includeme file="wp-content/gen-pages/resident_stories.html"]
        """
        try:
            file = self.content_dict['file'].lower()
        except KeyError as e:
            print("Maxbutton Key Error in dict: {}".format(self.content_dict))
            raise e
        self.content_dict['result'] = 'Error processing shortcode includeme for file: {}'.format(file)
        file_parts = file.split('/')
        if file_parts[0] == 'wp-content':
            file_parts = file_parts[1:]
        if file_parts == [] or file_parts[0] not in ['downloads', 'gen-pages', 'plots', 'uploads']:
            raise ShortcodeParameterError('Included file not in expected directory: {}'.format(file))
        file = Config.USER_DIRECTORY_BASE + '/'.join(file_parts)

        with open(file, 'r') as fl:
            res = fl.read()
            fl.close()
        if res:
            self.content_dict['result'] = '<div>' + res + '</div>'


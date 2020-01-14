import re
from utilities.process_urls import find_page_from_url, find_download_from_url
from config import Config
from db_mgt.photo_tables import Photo, PhotoGallery
from jinja2 import Environment, PackageLoader, select_autoescape
from utilities.sst_exceptions import ShortcodeError, ShortcodeParameterError, ShortcodeSystemError


class Shortcode(object):
    """Handler for a single shortcode.

    """
    available_shortcodes = ['maxbutton', 'singlepic', 'includeme', 'ngg_images']
    sc_re = re.compile(r'\[(\w+)( *.+)* *\]', re.I)
    sc_re_arg = re.compile(r'( *([A-Za-z0-9_]+) *= *"(.*)")+?')

    def __init__(self, db_session, string_to_match=None):
        self.session = db_session
        self.specific_processors = {'maxbutton': self._process_maxbutton,
                                    'singlepic': self._process_singlepic,
                                    'ngg_images': self._process_ngg_images,
                                    'includeme': self._process_include_me,
                                    'caption': None,  # see 'steve-and-david'  not sure where it comes from
                                    'src_lists_membership': None,
                                    'src_lists_admin': None
                                    }
        self.shortcode_string = string_to_match
        self.content_dict = None

    def parse_shortcode(self):
        # Need to verify/handle case where shortcode has contained string "[xx] yy [/xx]"
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
                    print("n: {}, {}".format(n, match.title()))
                    if n > 0:
                        arg_list = match.title()
                        while len(arg_list) > 0:
                            try:
                                parm1, parm2, arg_list = self._get_next_arg(arg_list)
                                res[parm1.lower()] = parm2
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

    def process_shortcode(self):
        if not self.content_dict:
            return None
        sc = self.content_dict['shortcode']
        if sc in self.specific_processors.keys():
            handler = self.specific_processors[sc]
            if handler:
                handler()

    def _process_maxbutton(self):
        try:
            button_type = self.content_dict['id']
            text_content = self.content_dict['text']
            url_content = self.content_dict['url']
        except KeyError as e:
            print("Maxbutton Key Error in dict: {}".format(self.content_dict))
            raise e
        target_page = find_page_from_url(self.session, url_content)
        if target_page:
            page_id = target_page.id
            target = 'http://' + Config.SERVER_NAME + "/main/page/" + str(page_id)
        else:
            target = find_download_from_url(url_content)
            if not target:
                return None  # TODO:  Is this really an error?  Displays as text content of shortcode
        button_type = "is-link"
        context = {'button_type': button_type,
                   'extra_styling': 'margin:3px;',
                   'target': target,
                   'text_content': text_content}
        res = Shortcode.run_jinja_template('base/button.html', context=context).replace('\n','')
        self.content_dict['result'] = res

    def _get_photo_by_id(self, photo_id, old_id=True):
        # TODO: change to current id's and update singlepic reference
        if old_id:
            photo_rec = self.session.query(Photo).filter(Photo.old_id == photo_id).first()
        else:
            photo_rec = self.session.query(Photo).filter(Photo.id == photo_id).first()
        gallery_id = photo_rec.old_gallery_id
        photo_file = photo_rec.file_name
        alt_text = photo_rec.alt_text
        photo_caption = photo_rec.caption
        gallery_rec = self.session.query(PhotoGallery).filter(PhotoGallery.old_id == gallery_id).first()
        file_path = gallery_rec.path_name + photo_file
        return photo_rec, gallery_rec, gallery_id, photo_file, photo_caption, alt_text, file_path

    def _get_photo_list_by_gallery_id(self, gallery_id, old_id=True):
        gallery_rec = self.session.query(PhotoGallery).filter(PhotoGallery.old_id == gallery_id).first()
        photo_ids = [x.id for x in self.session.query(Photo).filter(Photo.old_gallery_id == gallery_rec.old_id).all()]
        return photo_ids

    def _process_singlepic(self):
        try:
            keys = self.content_dict.keys()
            photo_id = self.content_dict['id']
            photo_height = 0
            if 'h' in keys:
                photo_height = self.content_dict['h']
            photo_width = 0
            if 'w' in keys:
                photo_width = self.content_dict['w']
            photo_title = ''
            if 'title' in keys:  # TODO: Allow title to be provided in spreadsheet
                photo_title = self.content_dict['title']
            photo_position = ''
            if 'align' in keys:
                photo_position = self.content_dict['align']
                if photo_position not in ['left', 'middle', 'right', 'top', 'bottom']:
                    raise ValueError(
                        'Unknown photo position: {}'.format(photo_position))  # TODO: return error to script
            photo_rec, gallery_rec, gallery_id, photo_file, photo_caption, alt_text, \
                file_path = self._get_photo_by_id(photo_id, old_id=True)
        except KeyError as e:
            print("Singlepic Key Error in dict: {}".format(self.content_dict))
            raise e

        photo_styling = "is-link"
        caption_styling = None
        title_styling = None
        # TODO:  Convert to https
        target = 'http://' + Config.SERVER_NAME + "/static/gallery/" + file_path
        res = Shortcode.format_single_pic(photo_title=photo_title, photo_caption=photo_caption,
                                          photo_position=photo_position, photo_height=photo_height,
                                          photo_width=photo_width,
                                          photo_styling=photo_styling, caption_styling=caption_styling,
                                          title_styling=title_styling, target=target, alt_text=alt_text)
        self.content_dict['result'] = res


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
            photo_title = ''
            photo_styling = ''
            caption_styling = ''
            title_styling = ''
            self.content_dict['photo_list'] = {}
            photo_dict = self.content_dict['photo_list']
            # TODO: if list is of length one, just do singlepic
            if len(photo_ids) == 1:
                for photo_id in photo_ids:              # retrieve single element from either list or set
                    break
                photo_rec, gallery_rec, gallery_id, photo_file, photo_caption, alt_text, \
                    file_path = self._get_photo_by_id(photo_id, old_id=True)
                target = 'http://' + Config.SERVER_NAME + "/static/gallery/" + file_path
                res = Shortcode.format_single_pic(photo_title=photo_title, photo_caption=photo_caption,
                                                  photo_width=width,
                                                  photo_styling=photo_styling, caption_styling=caption_styling,
                                                  title_styling=title_styling, target=target, alt_text=alt_text)
            else:
                for p_id in photo_ids:
                    photo_rec, gallery_rec, gallery_id, photo_file, photo_caption, alt_text, \
                        file_path = self._get_photo_by_id(p_id, old_id=False)
                    # TODO:  use https - doesn't work locally for some reason
                    target = 'http://' + Config.SERVER_NAME + "/static/gallery/" + file_path
                    photo_dict['photo_' + str(p_id)] = {'photo_title': photo_title, 'photo_caption': photo_caption,
                                                        'photo_width': width,
                                                        'photo_styling': photo_styling,
                                                        'caption_styling': caption_styling,
                                                        'title_styling': title_styling, 'target': target,
                                                        'alt_text': alt_text}
                res = Shortcode.run_jinja_template('base/slideshow.html', self.content_dict)
            self.content_dict['result'] = res

        except ShortcodeError as e:
            raise e

    @staticmethod
    def format_single_pic(**kwargs):
        tmp = Shortcode.run_jinja_template('base/picture.html', kwargs)
        return tmp

    @staticmethod
    def run_jinja_template(template, context):
        try:
            env = Environment(loader=PackageLoader('ssfl', 'templates'),
                              autoescape=(['html']))
            template = env.get_template(template)
            results = template.render(context)
            return results
        except Exception as e:
            print(e.args)
            foo = 3

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


if __name__ == '__main__':
    tests = [
        r'[singlepic id="345"]',
        r'[singlepic id="345" w="200" h="400" align="middle" title="asdfasdf" caption="qwerqwer"]',
        r'[singlepic id="" w="200" h="ddf" align="lefty" title="asdfasdf" caption="qwerqwer"]'
    ]
    for test in tests:
        sc = Shortcode(string_to_match=test)
        sc.parse_shortcode()

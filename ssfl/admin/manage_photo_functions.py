from db_mgt.json_tables import JSONStore, JSONStorageManager
from utilities.sst_exceptions import DataEditingSystemError, log_sst_error
from db_mgt.page_tables import PageManager
import sys
from ssfl.main.calendar_snippet import Calendar, SelectedEvents


# supported_functions = [('p_show', 'Create New JSON DB entry'),
#                        ('jedit', 'Edit Story JSON'),

# work_function = SelectField(label='Select Function',
#                             choices=supported_functions, render_kw={"id": "js1"})
# slideshow_id = IntegerField('JSON DB ID', validators=[Optional()], render_kw={"class": "p_show xxx sss"})
# slideshow_name = StringField('JSON Template Name', validators=[Optional()], render_kw={"class": "p_show xxx sss"})
# slide_list = StringField('Photos in show', validators=[Optional()], render_kw={"class": "p_show xxx sss"})
# show_title = StringField('Slideshow Title', validators=[Optional()], render_kw={"class": "p_show xxx sss"})
# slide_frame_height = IntegerField('Height of Slide Frame', validators=[Optional()],
#                                   render_kw={"class": "p_show xxx sss"})
# slide_frame_width = IntegerField('Width of Slide Frame', validators=[Optional()],
#                                  render_kw={"class": "p_show xxx sss"})
# slide_change = IntegerField('Rate of Slide Changes', validators=[Optional()],
#                             render_kw={"class": "p_show xxx sss"})
# submit = SubmitField('Submit')



def manage_photo_functions(db_exec, form):
    """Create, edit, modify photo related entries in JSONStore.

    """
    """
     Route: '/admin/manage_photos' => manage_photo_functions
     Template: manage_photos.jinja2
     Form: manage_photo_functions_form.py
     Processor: manage_photo_functions.py
    """
    work_function = form.work_function.data
    slideshow_id = form.slideshow_id.data
    slideshow_name = form.slideshow_name.data
    slide_list = form.slide_list.data
    show_title = form.show_title.data
    show_text = form.show_text.data

    slide_frame_height = form.slide_frame_height.data
    slide_frame_width = form.slide_frame_width.data
    slide_change = form.slide_change.data
    slide_align = form.slide_alignment.data

    submit = form.submit.data

    try:
        json_table_mgr = db_exec.create_json_manager()
        photo_manager = db_exec.create_photo_manager()
        slideshow_fields = JSONStorageManager.descriptor_slideshow_fields
        snippet_fields = JSONStorageManager.descriptor_slideshow_snippet_fields
        picture_fields = JSONStorageManager.descriptor_picture_fields
        snip_desc = json_table_mgr.make_json_descriptor(snippet_fields)

        # Create new entry in JSON store
        if work_function == 'p_show':
            snip_desc['title'] = show_title
            snip_desc['text'] = show_text
            show_desc = snip_desc['slides']
            show_desc['position'] = slide_align
            show_desc['height'] = slide_frame_height
            show_desc['width'] = slide_frame_width
            show_desc['rotation'] = slide_change
            pictures = slide_list.split(',')
            for pic in pictures:
                pic = pic.strip()
                if pic.isdigit():
                    pic_id = int(pic)
                    photo = photo_manager.get_photo_from_id(pic_id)
                else:
                    photo = photo_manager.get_photo_from_slug(pic.lower())
                pic_desc = json_table_mgr.make_json_descriptor(picture_fields)
                pic_desc['title'] = None
                pic_desc['id'] = photo.id
                pic_desc['url'] = photo_manager.get_photo_url(photo.id)
                pic_desc['caption'] = photo.caption
                pic_desc['alt_text'] = photo.alt_text
                pic_desc['height'] = slide_frame_height
                pic_desc['width'] = slide_frame_width
                pic_desc['alignment'] = slide_align
                show_desc['pictures'].append(pic_desc)
            json_table_mgr.add_json(slideshow_name, snip_desc)
            return True
        return False
    except Exception as e:
        log_sst_error(sys.exc_info(), 'Unexpected Error in manage_photo_functions')
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = 'Exception occurred processing page'
        return False

# {"SLIDESHOW_SNIPPET": None, "id": None, "title": None, "text": None,
#                                            "slides": "S_SLIDESHOW"}
# {"SLIDESHOW": None, "title": None, "title_class": None, "position": None,
#                                    "width": None, "height": None, "rotation": None,
#                                    "frame_title": None, "pictures": []}
{"PICTURE": None, "id": None, "url": None, "title": None, "caption": None,
                                 "width": None, "height": None, "alignment": None, "alt_text": None,
                                 "css_style": None, "css_class": None, "title_class": None,
                                 "caption_class": None, "image_class": None}
#     {% if slideshow.title and slideshow.title != 'NO NAME' %}
#         <figcaption class="{{ slideshow.title_class }}">{{ slideshow.title }}</figcaption>
#     {% endif %}
#     <div class="slideshow" interval="{{ slideshow.rotation }}">
#         {% for photo in slideshow.pictures %}
#             {% include 'base/picture.jinja2' %}
#         {% endfor %}
#     </div>
# </div>
# <div class="{{ photo.css_class }} float-left px-3" style="max-width: {{ photo.width }}px">
#     <figure class="figure">
#         {%  if photo.title %}
#             <figcaption class="figure-caption has-text-black {{ photo.title_class }}">{{ photo.title }}</figcaption>
#         {% endif %}
#         <img class="{{ photo.image_class }} figure-img img-fluid rounded"
#              src="{{ photo.url }}?h={{ photo.height }}&w={{ photo.width }}"
#              align="{{ photo.alignment }}"
#              height="{{ photo.height }}"
#              width="{{ photo.width }}"
#              alt="{{ photo.alt_text }}"/>
#         <figcaption class="figure-caption has-text-black photo.caption_class }}">{{ photo.caption }}</figcaption>
#     </figure>
from db_mgt.json_tables import JSONStore, JSONStorageManager
from utilities.sst_exceptions import DataEditingSystemError, log_sst_error
from db_mgt.page_tables import PageManager
import sys
import json
import re

# supported_functions = [('jcreate', 'Create New JSON DB entry'),
#                        ('jedit', 'Edit Story JSON'),
#                        ('jxxx', 'Create JSON descriptor for Story'),
#                        ('jdelete', 'Remove existing JSON entry'),
#                        ]
# work_function = SelectField(label='Select Function', choices=supported_functions)
# json_id = IntegerField('JSON DB ID', validators=[Optional()])
# json_name = StringField('JSON Template Name', validators=[Optional()])
# template_content = StringField('Name of JSON Template to Expand as Content', validators=[Optional()])
# compress = BooleanField('Remove excess whitespace and newlines?', default=False)
# story_template = StringField('JSON Template to Complete', validators=[Optional()])
# story_name = StringField('Slug for story to process', validators=[Optional()])
# story_author = StringField('Story Author (optional)', validators=[Optional()])
# story_title = StringField('Story Title (optional)', validators=[Optional()])
# snippet_picture_id = IntegerField('ID for picture for story snippet', validators=[Optional()])
# snip_pic_height = IntegerField('Photo height in pixels', validators=[Optional()])
# snip_pic_width = IntegerField('Photo width in pixels', validators=[Optional()])
# snip_pic_position = SelectField(label='Select Function', choices=['left', 'center', 'right'])
# page_slot = IntegerField('Slot on page for snippet', validators=[Optional()])
# page_template = StringField('JSON Template for page layout', validators=[Optional()])
# page_story_template = StringField('JSON Template of story to insert', validators=[Optional()])
# page_width = IntegerField('Width of story display (in pixels)', validators=[Optional()])
# submit = SubmitField('Submit')

def manage_json_templates(db_session, form):
    """Create, edit, modify JSON story entry in JSONStore.

    """
    work_function = form.work_function.data
    json_id = form.json_id.data
    json_name = form.json_name.data
    template_to_expand = form.template_content.data
    compress = form.compress.data

    story_template = form.story_template.data
    story_slug = form.story_slug.data
    story_author = form.story_author.data
    story_title = form.story_title.data
    snip_pic_height = form.snip_pic_height
    snip_pic_width = form.snip_pic_width
    snip_pic_position = form.snip_pic_position
    snippet_picture_id = form.snippet_picture_id.data

    page_slot = form.page_slot.data
    page_template = form.page_template.data
    page_story_template = form.page_story_template.data
    page_width = form.page_width.data

    submit = form.submit.data

    try:
        jsm = JSONStorageManager(db_session)
        if json_id:
            json_store_obj = db_session.query(JSONStore).filter(JSONStore.id == json_id).first()
        else:
            json_name = form.json_name.data.lower()
            json_store_obj = db_session.query(JSONStore).filter(JSONStore.name == json_name).first()

        # Create new entry in JSON store
        if work_function == 'jcreate':

            if json_store_obj:
                form.errors['JSON Entry Already Exists'] = ['Attempt to create an entry that already exists.']
                return False
            descriptor = jsm.make_json_descriptor(template_to_expand)
            jsm.add_json(json_name, descriptor)
            return True

        # Edit existing story entry so that it can be expanded
        elif work_function == 'jedit':
            template = jsm.get_json_from_name(story_template)
            if not template:
                form.errors['Nonexistent JSON template'] = ['Specified template does not exist']
                return False
            pages = PageManager(db_session)
            target_page = pages.get_page_from_name(story_slug)
            if not target_page:
                form.errors['Nonexistent Story'] = ['Specified story does not exist']
                return False
            template['author'] = story_author
            template['name'] = story_slug
            template['snippet']['photo']['id'] = snippet_picture_id
            template['snippet']['photo']['width'] = snip_pic_width
            template['snippet']['photo']['height'] = snip_pic_height
            template['snippet']['photo']['alignment'] = snip_pic_position
            jsm.add_json(story_template, template)
            return True

        # Edit page layout to insert a story
        elif work_function == 'jpage':
            template = jsm.get_json_from_name(page_template)
            if not template:
                form.errors['Nonexistent JSON page template'] = ['Specified page template does not exist']
                return False
            insert_template = jsm.get_json_from_name(page_story_template)
            if not insert_template:
                form.errors['Nonexistent story template'] = ['Specified story does not exist']
                return False
            count = 0
            for elem in jsm.find_instances(template, 'STORY_SNIPPET'):
                count += 1
                if count == page_slot:
                    elem['name'] = insert_template['name']
                    elem['author'] = insert_template['author']
                    elem['title'] = insert_template['title']
                    elem['photo']['id'] = insert_template['snippet']['photo']['id']
                    elem['photo']['height'] = insert_template['snippet']['photo']['height']
                    elem['photo']['width'] = insert_template['snippet']['photo']['width']
                    elem['photo']['alignment'] = insert_template['snippet']['photo']['alignment']
                    jsm.add_json(page_template, template)
                    return True


        elif work_function == 'jreset':
            jsm = JSONStorageManager(db_session)
            jsm.update_db_with_descriptor_prototype()
            return True
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False

    except Exception as e:
        log_sst_error(sys.exc_info(), 'Unexpected Error in edit_json_file')
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = 'Exception occurred processing page'
        return False

import sys

import json
import toml
from toml import TomlDecodeError
from utilities.sst_exceptions import NoSuchTOMLItem
from werkzeug.utils import secure_filename
from flask import send_file

from db_mgt.json_tables import JSONStorageManager
from ssfl.main.calendar_snippet import Calendar
from utilities.miscellaneous import get_temp_file_name
from utilities.sst_exceptions import log_sst_error
from utilities.toml_support import toml_to_dict, elaborate_toml_dict, dict_to_toml_file


# supported_functions = [('jcreate', 'Create New JSON DB entry'),
#                        ('jedit', 'Edit Story JSON'),
#                        ('jcal', 'Edit Calendar JSON'),
#                        ('jpage', 'Edit Page JSON'),
#                        ('jdelete', 'Remove existing JSON entry'),
#                        ('jreload', 'Reload DB Prototype Templates'),

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
# cal_template = StringField('JSON Template for Calendar', validators=[Optional()], render_kw={"class": "jcal"})
# cal_result_template = StringField('JSON Template to Create', validators=[Optional()], render_kw={"class": "jcal"})
# cal_display_count = IntegerField('Number of events to display', validators=[Optional()],
#                                      render_kw={"class": "jcal"}, default=6)
# cal_width = IntegerField('Number of columns in display', validators=[Optional()],
#                              render_kw={"class": "jcal"}, default=4)
# page_slot = IntegerField('Slot on page for snippet', validators=[Optional()])
# page_template = StringField('JSON Template for page layout', validators=[Optional()])
# page_story_template = StringField('JSON Template of story to insert', validators=[Optional()])
# page_width = IntegerField('Width of story display (in pixels)', validators=[Optional()])
# toml_file_name = StringField('File Name', validators=[DataRequired()],
#                                  render_kw={"class": "jtomldn", "docs": docs['jtomdnl']['file_name']})
# toml_overwrite = BooleanField('Overwrite Existing Template', validators=[Optional()], default=False,
#                              render_kw={"class": "jtomlup", "docs": docs['jtomlup']['overwrite']})
# toml_download_name =StringField('File name for TOML Result', validators=[Optional()],
#                                 render_kw={"class": "jpage jtomldn", "docs": docs['jtomldn']['out_file']})
# submit = SubmitField('Submit')



def manage_json_templates(db_exec, form):
    """Create, edit, modify JSON story entry in JSONStore.

    """
    """ 
     Route: '/admin/manageTemplate' => make_story_json_template
     Template: json_make_template.jinja2
     Form: db_manage_templates_form.py
     Processor: manage_json_template.py
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
    snip_pic_height = form.snip_pic_height.data
    snip_pic_width = form.snip_pic_width.data
    snip_pic_position = form.snip_pic_position.data
    snippet_picture_id = form.snippet_picture_id.data

    cal_template = form.cal_template.data
    # cal_result_template = form.cal_result_template.data
    cal_width = form.cal_width.data
    cal_display_count = form.cal_display_count.data

    page_slot = form.page_slot.data
    page_template = form.page_template.data
    page_content_template = form.page_content_template.data
    page_width = form.page_width.data

    toml_file_name = form.toml_file_name.data
    toml_overwrite = form.toml_overwrite.data
    toml_download_name = form.toml_download_name.data

    submit = form.submit.data

    try:
        json_table_mgr = db_exec.create_json_manager()
        jsm = JSONStorageManager(db_exec)
        json_name = form.json_name.data.lower()
        json_store_obj = json_table_mgr.get_json_record_by_name_or_id(json_id, json_name)

        # Create new entry in JSON store
        if work_function == 'jcreate':

            if json_store_obj:
                form.errors['JSON Entry Already Exists'] = ['Attempt to create an entry that already exists.']
                return False
            descriptor = jsm.make_json_descriptor(template_to_expand)
            json_table_mgr.add_json(json_name, descriptor)
            return True

        # Edit existing story entry so that it can be expanded
        elif work_function == 'jedit':
            template = json_table_mgr.get_json_from_name(template_to_expand)
            if not template:
                form.errors['Nonexistent JSON template'] = ['Specified template does not exist']
                return False
            pages = db_exec.create_page_manager()
            target_page = pages.fetch_page(None, story_slug)
            if not target_page:
                form.errors['Nonexistent Story'] = ['Specified story does not exist']
                return False
            template['author'] = story_author
            template['name'] = story_slug
            template['snippet']['author'] = story_author
            template['snippet']['name'] = story_slug
            template['snippet']['photo']['id'] = snippet_picture_id
            template['snippet']['photo']['width'] = snip_pic_width
            template['snippet']['photo']['height'] = snip_pic_height
            template['snippet']['photo']['alignment'] = snip_pic_position
            json_table_mgr.add_json(story_template, template)
            return True

        # Edit calendar snippet
        elif work_function == 'jcal':
            template = json_table_mgr.get_json_from_name(cal_template)
            if not template:
                form.errors['Nonexistent JSON template'] = ['Specified template does not exist']
                return False
            # TODO:  This should customize audience, categories, -> keyword arguments to create plugin
            calendar = Calendar(db_exec, cal_width)
            calendar.create_daily_plugin(cal_display_count)
            content = calendar.get_calendar_snippet_data()
            template['event_count'] = cal_display_count
            template['width'] = content['width']
            json_table_mgr.add_json(json_name, template)    # IS THIS RIGHT - was cal_result_template - redundant?
            return True

        # Edit page layout to insert a snippet
        elif work_function == 'jpage':
            template = json_table_mgr.get_json_from_name(page_template)
            if not template:
                form.errors['Nonexistent JSON page template'] = ['Specified page template does not exist']
                return False
            insert_template = json_table_mgr.get_json_from_name(page_content_template)

            if not insert_template:
                form.errors['Nonexistent story template'] = ['Specified story does not exist']
                return False
            entry_type = [x for x in ['STORY', 'STORY_SNIPPET', 'CALENDAR_SNIPPET',
                                      'SLIDESHOW_SNIPPET'] if x in insert_template]
            if entry_type:
                entry_type = entry_type[0]
            else:
                form.errors['page_content_template'] = [f'Unrecognized element entry type: {entry_type}']
                return False
            count = 0
            for elem in json_table_mgr.find_instances(template, 'CELL'):
                count += 1
                if count == page_slot:
                    if entry_type == 'STORY' or entry_type == 'STORY_SNIPPET':
                        if entry_type == 'STORY':
                            elem['element'] = insert_template['snippet']
                        else:
                            elem['element'] = insert_template
                        # These next 2 items should be corrected in the snippet
                        elem['element']['author'] = insert_template['author']  # Fix as story builds structure to older spec
                        elem['element']['name'] = insert_template['name']
                        elem['element_type'] = 'STORY_SNIPPET'
                        json_table_mgr.add_json(page_template, template)
                        return True
                    elif entry_type == 'CALENDAR_SNIPPET':
                        elem['element'] = insert_template
                        elem['element_type'] = 'CALENDAR_SNIPPET'
                        json_table_mgr.add_json(page_template, template)
                        return True
                    elif entry_type == 'SLIDESHOW_SNIPPET':
                        elem['element'] = insert_template
                        elem['element_type'] = 'SLIDESHOW_SNIPPET'
                        json_table_mgr.add_json(page_template, template)
                        return True

        elif work_function == 'jreset':
            json_table_mgr.update_db_with_descriptor_prototype()
            return True

        elif work_function == 'jreload':
            json_table_mgr.update_db_with_descriptor_prototype()
            return True

        elif work_function == 'jtomlup':
            file = form.toml_file_name.data
            secure_filename(file.filename)
            file_path = get_temp_file_name('toml_file', 'toml')     # TODO: use system tempfile
            file.save(file_path)
            with open(file_path, 'r') as fl:
                toml_load = toml.load(fl, dict)
                toml_dict = toml_to_dict(toml_load)
                toml_dict_expanded = elaborate_toml_dict(db_exec, toml_dict)
                json_obj = json.dumps(toml_dict_expanded)
                existing_template = json_table_mgr.get_json_from_name(json_name)
                if (existing_template and toml_overwrite) or (not existing_template and not toml_overwrite):
                    json_table_mgr.add_json(json_name, json_obj)
                else:
                    if toml_overwrite:
                        form.errors['toml_overwrite'] = [f'Existing template: {json_name} does not exist.']
                    else:
                        form.errors['toml_overwrite'] = [f'Existing template: {json_name} already exists.']
            return True

        elif work_function == 'jtomldn':
            json_store_obj = json_table_mgr.get_json_record_by_name_or_id(json_id, json_name)
            if json_store_obj is None:
                form.errors['JSON Entry Not Found'] = ['There was no entry with that id/name.']
                return False
            if json_store_obj.content != '' and json_store_obj.content is not None:
                file_path = get_temp_file_name('toml_file', 'toml')
                # file_path, json_store_obj, toml_download_name = res
                dict_to_toml_file(json.loads(json_store_obj.content), file_path)
                return send_file(file_path, mimetype='application/octet', as_attachment=True,
                                   attachment_filename=toml_download_name)
                return file_path, json_store_obj, toml_download_name + '.toml'
            return True

        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except NoSuchTOMLItem as e:
        log_sst_error(sys.exc_info(), 'TOML No such item')
        form.errors['Exception'] = [f'No such TOML item: {e.args[0]}']
        return False
    except TomlDecodeError as e:
        log_sst_error(sys.exc_info(), 'TOML Decode Error')
        form.errors['Exception'] = [f'Template Error: {e.args[0]}']
        return False
    except InvalidDateOrNumberTomlError as e:
        foo = 3
        ctx.fail((
            'Duplicate key: "{}" '
            'One frequent cause of this is using the same account name twice.'
        )).format(e.field)
    except DuplicateKeyTomlError as e:
        foo = 3
        ctx.fail((
            'Invalid date or number on field "{}" '
            'One frequent cause of this is forgetting to put quotes '
            'around secret keys. Check the file.'
        )).format(e.field)

    except Exception as e:
        log_sst_error(sys.exc_info(), 'Unexpected Error in edit_json_file')
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = 'Exception occurred processing page'
        return False

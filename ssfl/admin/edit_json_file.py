from db_mgt.json_tables import JSONStore, JSONStorageManager
from utilities.sst_exceptions import DataEditingSystemError, log_sst_error
from ssfl.main.multi_story_page import MultiStoryPage
from wtforms import ValidationError
import sys
import json
import re


# json_id = IntegerField('JSON DB ID', validators=[Optional()])
# json_name = StringField('JSON Template Name', validators=[Optional()])
# directory = StringField('Directory', validators=[DataRequired()], default=os.path.abspath(os.getcwd()))
# file_name = StringField('Save File Name', validators=[DataRequired()])
# file_type = StringField('File Type for Input', default='csv')
# submit = SubmitField('Save to File')

def edit_json_file(db_exec, form):
    """Edit file that is stored in database.

        This applies to the case where there is both a database entry and valid filename."""
    """
     Route: '/admin/json' => edit_json_file
     Template: json_edit.jinja2
     Form: edit_json_content_form.py
     Processor: edit_json_file.py
    """
    # supported_functions = [('jdown', 'Download JSON from Database'),
    #                        ('jup', 'Upload JSON to Database'),
    #                        ('jcsv', 'Create JSON descriptor for Story'),
    #                        ]
    # work_function = SelectField(label='Select Function',  choices=supported_functions)
    work_function = form.work_function.data
    json_id = form.json_id.data
    json_name = form.json_name.data
    direct = form.directory.data
    file = form.file_name.data
    file_type = form.file_type.data
    is_prototype = form.is_prototype.data
    compress = form.compress.data
    submit = form.submit.data

    try:
        json_table_mgr = db_exec.create_json_manager()
        jsm = JSONStorageManager(db_exec)
        json_name = form.json_name.data.lower()
        json_store_obj = json_table_mgr.get_json_record_by_name_or_id(json_id, json_name)

        if work_function == 'jdown':  # => from DB to file
            if json_store_obj is None:
                form.errors['JSON Entry Not Found'] = ['There was no entry with that id/name.']
                return False
            if json_store_obj.content != '' and json_store_obj.content is not None:
                # TODO: THIS IS WRITING TO A LOCAL FILE - use save_file
                with open(direct + '/' + file, 'w') as fl:
                    fl.write(json_store_obj.content)
                    fl.close()
                    return True
            else:
                form.errors['JSON Empty'] = ['Database page had no content']
                return False
        elif work_function == 'jcsv':  # => from file to DB for page descriptor
            if file_type == 'csv':
                msp = MultiStoryPage(db_exec)
                msp.make_descriptor_from_csv_file(file)
                descriptor = msp.get_descriptor_as_string()
                json_table_mgr.add_json(json_name, descriptor)
                return True
        elif work_function == 'jup':  # => presumes valid json content
            with open(direct + '/' + file + '.' + file_type, 'r', encoding='utf-8-sig') as fl:
                content = fl.read()
                if is_prototype:
                    json_name = json_name.upper()
                if compress:
                    content = ''.join(content.split())
                json_table_mgr.add_json(json_name, content)
                return True
        elif work_function == 'jreset':
            json_table_mgr.update_db_with_descriptor_prototype()
            return True
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False

    except Exception as e:
        log_sst_error(sys.exc_info(), 'Unexpected Error in edit_json_file')
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = 'Exception occurred processing page'
        return False

    finally:
        db_exec.terminate()

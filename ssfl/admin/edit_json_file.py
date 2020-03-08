from db_mgt.json_tables import JSONStore, JSONStorageManager
from utilities.sst_exceptions import DataEditingSystemError, log_sst_error
from ssfl.main.multi_story_page import MultiStoryPage
from wtforms import ValidationError
import sys


# json_id = IntegerField('JSON DB ID', validators=[Optional()])
# json_name = StringField('JSON Template Name', validators=[Optional()])
# directory = StringField('Directory', validators=[DataRequired()], default=os.path.abspath(os.getcwd()))
# file_name = StringField('Save File Name', validators=[DataRequired()])
# file_type = StringField('File Type for Input', default='csv')
# submit = SubmitField('Save to File')

def edit_json_file(session, form):
    """Edit file that is stored in database.

        This applies to the case where there is both a database entry and valid filename."""
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
    submit = form.submit.data

    try:
        if json_id:
            json = session.query(JSONStore).filter(JSONStore.id == json_id).first()
        else:
            json_name = form.json_name.data.lower()
            json = session.query(JSONStore).filter(JSONStore.name == json_name).first()
        if work_function == 'jdown':        # => from DB to file
            if json is None:
                form.errors['JSON Entry Not Found'] = ['There was no entry with that id/name.']
                return False
            if json.content != '' and json.content is not None:
                with open(direct + '/' + file, 'w') as fl:
                    fl.write(json.content)
                    fl.close()
                    return True
            else:
                form.errors['JSON Empty'] = ['Database page had no content']
                return False
        elif work_function == 'jcsv':        # => from file to DB for page descriptor
            if file_type == 'csv':
                msp = MultiStoryPage(session)
                msp.make_descriptor_from_csv_file(file)
                descriptor = msp.get_descriptor_as_string()
                jsm = JSONStorageManager(session)
                jsm.add_json(json_name, descriptor)
                session.commit()
                return True
        elif work_function == 'jup':                           # => presumes valid json content
            with open(direct + '/' + file + '.' + file_type, 'r') as fl:
                jsm = JSONStorageManager(session)
                jsm.add_json(json_name, fl.read())
                session.commit()
                return True
        elif work_function == 'jdown':
            with open(direct + '/' + file, 'w') as fl:
                fl.write(json.content)
                fl.close()
                return True
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False

    except Exception as e:
        log_sst_error(sys.exc_info(), 'Unexpected Error in edit_json_file')
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = 'Exception occurred processing page'
        return False

from db_mgt.json_tables import JSONStore, JSONStorageManager
from utilities.sst_exceptions import DataEditingSystemError,log_error
from ssfl.main.multi_story_page import MultiStoryPage
from wtforms import ValidationError

# json_id = IntegerField('JSON DB ID', validators=[Optional()])
# json_name = StringField('JSON Template Name', validators=[Optional()])
# directory = StringField('Directory', validators=[DataRequired()], default=os.path.abspath(os.getcwd()))
# file_name = StringField('Save File Name', validators=[DataRequired()])
# file_type = StringField('File Type for Input', default='csv')
# direction = BooleanField('Transfer to file', default=True)
# submit = SubmitField('Save to File')

def edit_json_file(session, form):
    """Edit file that is stored in database.

        This applies to the case where there is both a database entry and valid filename."""
    json_id = form.json_id.data
    json_name = form.json_name.data
    direct = form.directory.data
    file = form.file_name.data
    file_type = form.file_type.data
    direction = form.direction.data
    submit = form.submit.data

    try:
        if json_id:
            json = session.query(JSONStore).filter(JSONStore.id == json_id).first()
        else:
            json_name = form.json_name.data.lower()
            json = session.query(JSONStore).filter(JSONStore.name == json_name).first()
        if direction:   # True => from DB to file
            if json is None:
                form.errors['JSON Entry Not Found'] = ['There was no entry with that name.']
                return False
            if json.content != '' and json.content is not None:
                with open(direct + '/' + file, 'w') as fl:
                    fl.write(json.content)
                    fl.close()
                    return True
            else:
                form.errors['JSON Empty'] = ['Database page had no content']
                return False
        else:
            if file_type == 'csv':
                msp = MultiStoryPage(session)
                msp.make_descriptor_from_csv_file(file)
                descriptor = msp.get_descriptor_as_string()
                jsm = JSONStorageManager(session)
                jsm.add_json(json_name, descriptor)
                session.commit()
                return True
            else:
                with open(direct + '/' + file, 'r') as fl:
                    json.content = fl.read()
                    fl.close()
                    session.commit()
                    return True
    except Exception as e:
        log_error(e, 'Unexpected Error in edit_json_file')
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = ['Exception occurred processing page']
        return False


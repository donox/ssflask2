from db_mgt.json_tables import JSONStore, JSONStorageManager
from utilities.sst_exceptions import DataEditingSystemError, log_sst_error
from utilities.toml_support import dict_to_toml_file
import sys
from werkzeug.utils import secure_filename
from utilities.miscellaneous import get_temp_file_name
from utilities.toml_support import toml_to_dict, elaborate_toml_dict
import toml, json
from datetime import datetime as dt


def manage_photo_metadata(db_exec, form, request):
    """Functions to manage photos.

    """
    """ 
     Route: '/admin/manageTemplate' => make_story_json_template
     Template: json_make_template.jinja2
     Form: db_manage_templates_form.py
     Processor: manage_json_template.py
    """
    work_function = form.work_function.data
    folder = form.folder.data
    early_date = form.early_date.data
    latest_date = form.latest_date.data
    download_filename = form.download_filename.data

    photo_mgr = db_exec.create_sst_photo_manager()
    try:
        # Download toml template
        if work_function == 'ph_tml':
            photo_list = photo_mgr.get_photos_by_time_and_folder(folder, early_date, latest_date)
            if photo_list:
                res = {"Photo_Metadata":[]}
                for photo in photo_list:
                    metadata = json.loads(photo.json_metadata)
                    metadata['id'] = photo.id
                    metadata['slug'] = photo.slug
                    metadata['gallery_folder'] = photo.folder_name
                    metadata['file'] = photo.file_name
                    metadata['caption'] = photo.caption
                    metadata['alt_text'] = photo.alt_text
                    metadata['image_upload'] = photo.image_date.isoformat()
                    res["Photo_Metadata"].append(metadata)
                file_path = get_temp_file_name('toml_file', 'toml')
                return file_path, res, download_filename + '.toml'
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False

    except Exception as e:
        log_sst_error(sys.exc_info(), 'Unexpected Error in manage_photo_metadata')
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = 'Exception occurred processing manage_photo_metadata'
        return False
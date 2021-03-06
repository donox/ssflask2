from db_mgt.json_tables import JSONStore, JSONStorageManager
from utilities.sst_exceptions import DataEditingSystemError, log_sst_error
from utilities.toml_support import dict_to_toml_file
import sys
from werkzeug.utils import secure_filename
from utilities.miscellaneous import get_temp_file_name
from utilities.toml_support import toml_to_dict, elaborate_toml_dict
import toml, json
from datetime import datetime as dt
from flask import send_file


def manage_photo_metadata(db_exec, form):
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
    upload_filename = form.upload_filename.data
    wp_url = form.wp_url.data
    wp_photo_id = form.wp_photo_id.data
    sst_photo_slug = form.sst_photo_slug.data

    photo_mgr = db_exec.create_sst_photo_manager()
    try:
        # Download toml template
        if work_function == 'ph_tml':
            photo_list = photo_mgr.get_photos_by_time_and_folder(folder, early_date, latest_date)
            if photo_list:
                res = {"Photo_Metadata": []}
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
                dict_to_toml_file(res, file_path)
                return send_file(file_path, mimetype='application/octet', as_attachment=True,
                                 attachment_filename=download_filename + '.toml')
            else:
                form.errors['work_function'] = [f'No photos meet given selection criteria']
        elif work_function == 'ph_up':
            file = form.upload_filename.data
            secure_filename(file.filename)
            file_path = get_temp_file_name('toml_file', 'toml')  # TODO: use system tempfile
            file.save(file_path)
            with open(file_path, 'r') as fl:
                toml_dict = toml_to_dict(toml.load(fl, dict))
                toml_dict_expanded = elaborate_toml_dict(db_exec, toml_dict)
                all_metadata = toml_dict_expanded['Photo_Metadata']
                all_res = True
                for photo_metadata in all_metadata:
                    photo_id = photo_metadata['id']
                    caption = photo_metadata['caption']
                    del photo_metadata['caption']
                    alt_text = photo_metadata['alt_text']
                    del photo_metadata['alt_text']
                    json_obj = json.dumps(photo_metadata)
                    res = photo_mgr.update_metadata(photo_id, caption, alt_text, json_obj)
                    if not res:
                        form.errors['work_function'] = [f'Failure updating metadata for photo {photo_id}']
                        all_res = False
                return all_res
        elif work_function == 'ph_ngg':
            try:
                sess = db_exec.db_session
                sql = f'select exists(select * from sst_photos where slug="{sst_photo_slug}");'
                res = sess.execute(sql).first()[0]
                if not res:
                    db_exec.add_error_to_form("No such Photo", f'Slug: {sst_photo_slug} does not exist.')
                    return False
                sql = f'select exists(select * from wp_ngg_pictures where pid={wp_photo_id});'
                res = sess.execute(sql).first()[0]
                if res:
                    sql = f'update wp_ngg_pictures set filename="{wp_url}" where pid={wp_photo_id};'
                    sess.execute(sql)
                else:
                    slug = f'dummy-slug-{wp_photo_id}'
                    sql = f'insert into wp_ngg_pictures (pid, filename, image_slug) values ({wp_photo_id}, "{wp_url}", '
                    sql += f'"{slug}");'
                    sess.execute(sql)
                sql = f'update sst_photos set old_id={wp_photo_id} where slug="{sst_photo_slug}";'
                res = sess.execute(sql)
                sess.commit()
                return True
            except Exception as e:
                db_exec.add_error_to_form("Exception", f'Exception: {e.args}.')
                return False
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False

    except Exception as e:
        log_sst_error(sys.exc_info(), 'Unexpected Error in manage_photo_metadata')
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = 'Exception occurred processing manage_photo_metadata'
        return False

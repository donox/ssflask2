from ssfl import sst_syslog
import json
from werkzeug.utils import secure_filename
from db_mgt.page_tables import Page, PageManager
from db_mgt.sst_photo_tables import SSTPhoto, PhotoExif
from utilities.miscellaneous import get_temp_file_name
import csv
from config import Config
import PIL
from utilities.toml_support import toml_to_dict, elaborate_toml_dict, dict_to_toml_file

exif_to_meta = dict()
# "Image DateTime" = "(0x0132) ASCII=2017:05:16 11:44:46 @ 200"
exif_to_meta['Image DateTime'] = 'ImageTaken'
# "EXIF CameraOwnerName" = "(0xA430) ASCII= @ 8644"
exif_to_meta['EXIF CameraOwnerName'] = 'CameraOwner'
# "EXIF BodySerialNumber" = "(0xA431) ASCII=152037003009 @ 8676"
exif_to_meta['BodySerialNumber'] = 'CameraSerial'
# exif_to_meta['x'] = 'x'
# exif_to_meta['x'] = 'x'
# exif_to_meta['x'] = 'x'
# exif_to_meta['x'] = 'x'
# exif_to_meta['x'] = 'x'
meta_to_exif = dict()
for key, val in exif_to_meta.items():
    meta_to_exif[val] = key

def upload_photo_file(db_exec, folder, file):
    """Upload a photo and save in the gallery."""
    """
     Route: 'photo/upload_photos' => upload_photos
     Template: photo/upload_photos.jinja2
     Processor: photo/upload_photos.py
    """
    try:
        sst_syslog.make_info_entry(f'upload_photo_file: Starting')
        photo_mgr = db_exec.create_sst_photo_manager()
        filename = secure_filename(file.filename)
        photo_folder = Config.USER_DIRECTORY_IMAGES
        sst_syslog.make_info_entry(f'upload_photo_file: photo_exists')
        photo_mgr.ensure_folder_exists(folder)
        # sst_syslog.make_info_entry(f'upload_photo_file: photo_exists {gallery}')
        filepath = photo_folder + folder + '/' + filename
        file.save(filepath)
        sst_syslog.make_info_entry(f'upload_photo_file: file saved - path: {filepath}')

        # exif = PhotoExif(db_exec, 0, filepath=filepath)
        # tags = exif.get_tags()
        # dict_to_toml_file(tags, '/home/don/devel/exif.toml')

        #
        # imag = PIL.Image.open(filepath)
        # for segment, content in imag.applist:
        #     marker, body = content.split(b'\x00', 1)
        #     if segment == 'APP1' and marker == b'http://ns.adobe.com/xap/1.0/':
        #         foo = 3
        metadata = photo_mgr.get_empty_json()
        metadata_str = json.dumps(metadata)

        photo = photo_mgr.get_photo_if_exists(folder, filename)
        if not photo:
            photo = SSTPhoto(file_name=filename, folder_name=folder, json_metadata=metadata_str)
            photo.add_to_db(db_exec, commit=True)
        return True
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        sst_syslog.make_error_entry(f'upload_photo_file. Error: {e.args[0]}, {e.args[1]}')
        return False

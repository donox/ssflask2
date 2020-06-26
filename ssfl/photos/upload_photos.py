from ssfl import sst_syslog
import json
from werkzeug.utils import secure_filename
from db_mgt.page_tables import Page, PageManager
from db_mgt.sst_photo_tables import SSTPhoto, PhotoExif
from utilities.miscellaneous import get_temp_file_name
import csv
from config import Config
from PIL import Image, ExifTags
from iptcinfo3 import IPTCInfo
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

def make_slug(folder: str, file_name: str) -> str:
    """Make slug by combining folder/file names with hyphes, LC."""
    file_name = file_name.replace('-', ' ').replace('_', ' ')
    file_name = file_name.split('.')
    file_name = file_name[0]
    folder = folder.replace('-', ' ').replace('_', ' ')
    fn = folder + ' ' + file_name
    fn = fn.split(' ')
    slug = '-'.join(fn).lower()
    return slug

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
        photo_folder = Config.USER_DIRECTORY_IMAGES + folder
        sst_syslog.make_info_entry(f'upload_photo_file: photo_exists')
        created = photo_mgr.ensure_folder_exists(photo_folder)
        if created:              # created is bool - true if folder created.  Any new folder is forced to l/c
            folder = folder.lower()
            photo_folder = Config.USER_DIRECTORY_IMAGES + folder
        # sst_syslog.make_info_entry(f'upload_photo_file: photo_exists {gallery}')
        filepath = photo_folder + '/' + filename
        file.save(filepath)
        sst_syslog.make_info_entry(f'upload_photo_file: file saved - path: {filepath}')

        #Check if we need to rotate photo  - THis does not work - Assuming no need for now
        try:
            # info = IPTCInfo(filepath)   # seems to be getting 'marker scan fail'
            image = Image.open(filepath)
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            exif = dict(image._getexif().items())
            if exif[orientation] == 3:
                image = image.rotate(180, expand=True)
            elif exif[orientation] == 6:
                image = image.rotate(270, expand=True)
            elif exif[orientation] == 8:
                image = image.rotate(90, expand=True)

            image.save(filepath)
            image.close()
        except (AttributeError, KeyError, IndexError):
            # cases: image doesn't have getexif
            pass

        # image = Image.open(filepath)
        # for segment, content in image.applist:            # What was I looking at here???
        #     print(segment)
        #     marker, body = content.split(b'\x00', 1)
        #     if segment == 'APP13':
        #         foo = 3
        metadata = photo_mgr.get_empty_json()
        metadata_str = json.dumps(metadata)

        photo = photo_mgr.get_photo_if_exists(folder, filename)
        slug = make_slug(folder, filename)
        if not photo:
            # If photo exists, we use the existing DB entry
            photo = SSTPhoto(file_name=filename, folder_name=folder, json_metadata=metadata_str, slug=slug)
            photo.add_to_db(db_exec, commit=True)
        return True
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        sst_syslog.make_error_entry(f'upload_photo_file. Error: {e.args[0]}, {e.args[1]}')
        return False

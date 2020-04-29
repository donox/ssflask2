from io import BytesIO
import os
import sys
from datetime import datetime as dt
from config import Config

from PIL import Image
import exifread
from flask import url_for, render_template
from sqlalchemy import UnicodeText, text

from config import Config
from ssfl import db
from utilities.miscellaneous import run_jinja_template, make_db_search_string
from utilities.sst_exceptions import PhotoHandlingError
from utilities.sst_exceptions import PhotoOrGalleryMissing
from .base_table_manager import BaseTableManager
from .json_tables import JSONStorageManager as jsm
from db_mgt.pa_db_connect_problems import TestPADB

json_metadata_descriptor = {"title": None, "photographer": None, "people": [],
                            "keywords": None, "xxx": None}


class SSTPhotoManager(BaseTableManager):
    """Manager to control access to Photos, Slideshows, and Galleries

    """

    def __init__(self, db_session):
        super().__init__(db_session)
        self.get_photo_field_value = self.get_table_value('sst_photos')

    def ensure_folder_exists(self, directory: str) -> None:
        """Create a folder in the PHOTO directory if it does not already exist."""
        try:
            foo = TestPADB()  # Remove???  ###########
            foo.test_connection()  # Ditto
            if os.path.exists(directory):
                return
            else:
                os.mkdir(directory)
                return
        except Exception as e:
            print(f'Failure checking photo directory: {sys.exc_info()}')
            raise e

    def get_photo_if_exists(self, folder, filename):
        """Get photo from folder, filename or return False"""
        try:
            photo = self.db_session.query(SSTPhoto).filter(SSTPhoto.folder_name == folder).filter(
                SSTPhoto.file_name == filename).first()
            if photo:
                return photo
            else:
                return False
        except Exception as e:
            print(f'Failure going to database: {sys.exc_info()}')  # Remove
            sys.stdout.flush()  # Remove ########################################
            raise e

    def get_photo_by_id_if_exists(self, photo_id):
        """Get photo from folder, filename or return False"""
        try:
            photo = self.db_session.query(SSTPhoto).filter(SSTPhoto.id == photo_id).first()
            if photo:
                return photo
            else:
                return False
        except Exception as e:
            print(f'Failure going to database: {sys.exc_info()}')  # Remove
            sys.stdout.flush()  # Remove ########################################
            raise e

    def delete_photo(self, photo_id):
        photo = self.get_photo_by_id_if_exists(photo_id)
        if photo:
            sql = f'delete from sst_photos where id={photo_id}'
            self.db_session.execute(sql)
            self.db_session.commit()

    def get_photos_by_time_and_folder(self, folder, early_date, latest_date):
        ed = str(early_date)
        ld = str(latest_date)
        if folder and not early_date:
            res = self.db_session.query(SSTPhoto).filter(SSTPhoto.folder_name == folder).all()
        elif folder and early_date and not latest_date:
            res = self.db_session.query(SSTPhoto).filter(SSTPhoto.folder_name == folder). \
                filter(SSTPhoto.image_date >= ed).all()
        elif folder and early_date and latest_date:
            res = self.db_session.query(SSTPhoto).filter(SSTPhoto.folder_name == folder). \
                filter(SSTPhoto.image_date >= ed).filter(SSTPhoto.image_date <= ld).all()
        elif not folder and early_date and not latest_date:
            res = self.db_session.query(SSTPhoto).filter(SSTPhoto.image_date >= ed).all()
        elif not folder and early_date and latest_date:
            res = self.db_session.query(SSTPhoto).filter(SSTPhoto.image_date >= ed).filter(
                SSTPhoto.image_date <= ld).all()
        else:
            return None
        return res

    def get_empty_json(self):
        return json_metadata_descriptor

    def update_metadata(self, photo_id: int, caption: str, alt_text: str, new_metadata: str) -> bool:
        sql = text(f'update sst_photos set json_metadata = :j, caption = :c, alt_text = :a where id= {photo_id}')
        try:
            self.db_session.execute(sql, params=dict(j=new_metadata, c=caption, a=alt_text))
            self.db_session.commit()
            return True
        except Exception as e:
            # LOG ERROR
            return False

    def get_photo_from_slug(self, slug):
        sql = f'select * from sst_photos where slug="{slug}"'
        photo = self._get_photo(sql)
        if photo.id:
            return photo
        # Attempt again trying for the most recent photo with slug as a substring.
        sql = f'select * from sst_photos where slug like"%{slug}%" order by image_date desc limit 1;'
        photo = self._get_photo(sql)
        if photo.id:
            return photo
        else:
            return None

    def get_photo_from_id(self, photo_id):
        sql = f'select * from sst_photos where id={photo_id};'
        return self._get_photo(sql)

    def _get_photo(self, sql):
        res = self.db_session.execute(sql).first()
        if res:
            gv = self.get_photo_field_value(res)
            photo = SSTPhoto(id=gv('id'), slug=gv('slug'), folder_name=gv('folder_name'), caption=gv('caption'),
                             alt_text=gv('alt_text'), file_name=gv('file_name'), image_date=gv('image_date'),
                             json_metadata=gv('json_metadata'))
            return photo
        else:
            # Missing photo - return dummy
            photo = SSTPhoto(id=0, slug='no-slug', file_name='no_such_file', image_date=None, json_metadata=None)
            return photo

    def get_photo_from_path(self, path):
        photo_path = path.split('/')
        filename = photo_path[-1]
        folder = photo_path[-2]

        try:
            sql = 'SELECT *  FROM sst_photos '
            sql += f'WHERE file_name = "{filename}" and folder={folder};'
            photo = SSTPhoto()
            res = self.db_session.execute(sql).first()
            photo_id, image_slug, file_name, folder, meta_data, image_date = res
            photo.id = photo_id
            photo.image_slug = image_slug
            photo.file_name = file_name
            photo.folder = folder
            photo.image_date = image_date
            photo.meta_data = meta_data
            return photo
        except Exception as e:
            raise SystemError(f'Failure retrieving photo {photo_path}')

    def get_photos_in_folder(self, folder_name):
        sql = f'select * from sst_photos where folder={folder_name}'
        sql_res = self.db_session.execute(sql).all()
        res = []
        for row in sql_res:
            gv = self.get_photo_field_value(row)
            photo = SSTPhoto(id=gv('id'), image_slug=gv('image_slug'), folder=gv('folder'),
                             file_name=gv('file_name'),
                             image_date=gv('image_date'), meta_data=gv('metadata'))
            res.append(photo)
        return res

    def get_photo_url(self, photo_id):
        try:
            temp = self.get_photo_folder_and_name(photo_id)
            if temp:
                url = url_for('admin_bp.get_image', image_path=temp)
                return url
            return None
        except Exception as e:
            raise e

    def get_photo_file_path(self, photo_id):
        res = self.get_photo_folder_and_name(photo_id)
        if res:
            return Config.UPLOADED_PHOTOS_DEST + res
        else:
            return None

    def get_photo_folder_and_name(self, photo_id):
        try:
            photo = self.get_photo_from_id(photo_id)
            if photo:
                if photo.folder_name.endswith('/'):
                    return photo.folder_name + photo.file_name
                else:
                    # This should not be necessary, but we may be inconsistent.
                    return photo.folder_name + '/' + photo.file_name
            else:
                return None
        except Exception as e:
            raise e

    def get_slideshow(self, db_exec, show_name='NEED PHOTO NAME'):
        slideshow = SlideShow(show_name, db_exec)
        return slideshow

    def get_resized_photo(self, photo, width=None, height=None):
        """Get  resized copy of self photo into temporary file.
        """
        try:
            file_path = self.get_photo_file_path(photo.id)
            file = Config.USER_DIRECTORY_IMAGES + file_path
            if os.path.exists(file):
                image = Image.open(file)
            else:
                raise PhotoHandlingError(f'Photo file does not exist: {file}')

            # print(f'Image Size {image.size}')
            image.thumbnail((width, height))

            # tmp_fl = get_temp_file_name('photo', 'jpg')
            byte_io = BytesIO()
            image.save(byte_io, 'JPEG')
            return byte_io
        except PhotoHandlingError as e:
            raise e
        except Exception as e:
            raise e

    def get_new_photo_id_from_old(self, old_id):
        """Get sstPhoto id from original WP photo ID
        This requires mapping via something other than ID's, so we will get the file name of the original photo
        and try to match that.  To do this properly, we need to get the folder name also which must be taken from
        the gallery."""
        sql = f'select photo_id from v_photo_picture where wp_picture_id={old_id};'
        new_id = self.db_session.execute(sql).first()
        if not new_id:
            return None
        new_id = new_id[0]
        # Now find the photo in Photo (the imported table).
        sql = f'select image_slug, file_name, gallery_id from photo where id={new_id};'
        res = self.db_session.execute(sql).first()
        if not res:
            return None
        slug, file_name, new_gal = res
        sql = f'select path_name from photo_gallery where id={new_gal};'
        folder = self.db_session.execute(sql).first()
        if not folder:
            return None
        folder = folder[0]
        sql = f'select id from sst_photos where file_name="{file_name}" and folder_name="{folder}";'
        target_id = self.db_session.execute(sql).first()
        if not target_id:
            return None
        else:
            return target_id[0]

    def get_recent_photos(self, nbr_to_get):
        sql = f'select id from sst_photos order by image_date desc limit {nbr_to_get};'
        res = self.db_session.execute(sql)
        photos = []
        for ndx in res:
            new_photo = self.get_photo_by_id_if_exists(ndx[0])
            photos.append(new_photo)
        return photos

    def get_records_by_field_search(self, field, folder_search, search_string, nbr_to_get):
        search = make_db_search_string(search_string.lower())
        find_folder = make_db_search_string(folder_search.lower())
        sql = f'select id from sst_photos where '
        if search_string:
            sql += f'{field} like lower("{search}") '
        if search_string and folder_search:
            sql += f'and '
        if folder_search:
            sql += f'folder_name like lower("{find_folder}") '
        sql += f'order by image_date desc limit {nbr_to_get}'
        res = self.db_session.execute(sql)
        photos = []
        for ndx in res:
            new_photo = self.get_photo_by_id_if_exists(ndx[0])
            photos.append(new_photo)
        return photos


class SlideShow(object):
    """
    Collection of photos rendered by template to produce html for slideshow.
    """

    def __init__(self, name, db_exec):
        # ['SLIDESHOW', 'title', 'title_class', 'position', 'width', 'height', 'rotation', 'frame_title', 'pictures']
        self.db_exec = db_exec
        self.json_store_manager = db_exec.create_json_manager()
        self.photo_manager = db_exec.create_sst_photo_manager()
        self.show_desc = self.json_store_manager.get_json_from_name('P_SLIDESHOW')
        self.show_desc['title'] = name
        self.show_desc['title_class'] = 'title_class'
        self.show_desc['position'] = 'center'
        self.show_desc['width'] = 300
        self.show_desc['height'] = 250
        self.show_desc['rotation'] = 3.0
        self.show_desc['pictures'] = []
        self.html = ''

    def add_photo(self, photo_id):
        new_photo = Picture(self.db_exec, photo_id)  # We create a Picture (not get_photo) as that creates the
                                                     # descriptor for the Picture structure.
        if new_photo:
            desc = new_photo.get_picture_descriptor()
            # When the photo description is encountered, the picture descriptor does not exist.  However, it
            # will exist before another photo is encountered.  Therefore, we use a caption field on the slideshow
            # descriptor as a temporary location to pass the caption to the picture.
            if 'caption' in self.show_desc and self.show_desc['caption']:
                desc['caption'] = self.show_desc['caption']
                self.show_desc['caption'] = None
            self.show_desc['pictures'].append(desc)
        else:
            self.db_exec.add_error_to_form('Missing Photo', f'Slideshow is missing photo {photo_id}')

    def add_existing_photo(self, photo):
        self.show_desc['pictures'].append(photo.get_picture_descriptor())

    def add_title(self, title):
        self.show_desc['title'] = title

    def add_caption(self, caption):
        self.show_desc['caption'] = caption

    def set_position(self, position):
        self.show_desc['position'] = position

    def set_rotation(self, rotation):
        self.show_desc['rotation'] = rotation

    def set_dimension(self, dimension, size):
        if dimension == 'width':
            self.show_desc['width'] = size
        else:
            self.show_desc['height'] = size

    def get_html(self):
        wt = self.show_desc['width']
        ht = self.show_desc['height']
        for photo in self.show_desc['pictures']:
            photo['width'] = wt
            photo['height'] = ht
        context = {'slideshow': self.show_desc}
        self.html = render_template('base/slideshow.jinja2', **context)
        return self.html


class Picture(object):
    """Access picture information from descriptor.

    The notion of a picture vs a photo is that the photo refers to the actual image
    as stored in the database and managed by the class Photo above.  A picture is intended
    to apply to its usage on the web (though the distinction is not maintained carefully. :-("""

    def __init__(self, db_exec, photo_id: int):
        # ['PICTURE', 'id', 'url', 'title', 'caption', 'width', 'height', 'alignment', 'alt_text',
        #             'css_style', 'css_class', 'title_class', 'caption_class', 'image_class']
        self.json_store = db_exec.create_json_manager()
        self.picture_desc = self.json_store.get_json_from_name('P_PICTURE')
        self.db_exec = db_exec
        self.picture_desc['id'] = photo_id
        self.picture_manager = db_exec.create_sst_photo_manager()
        res = self.picture_manager.get_photo_from_id(photo_id)
        if res and res.id:
            db_photo = res
            folder = db_photo.folder_name
            file_name = db_photo.file_name
            self.picture_desc['alt_text'] = db_photo.alt_text
            self.picture_desc['caption'] = db_photo.caption
            if folder.endswith('/'):
                relative_path = '/static/gallery/' + folder + file_name
            else:
                relative_path = '/static/gallery/' + folder + '/' + file_name
            self.picture_desc['url'] = relative_path
        else:
            self.db_exec.add_error_to_form('Missing Photo', f'Photo {photo_id} does not exist.')
            return None

    def get_picture_location(self):
        return self.picture_desc['url']

    def get_picture_descriptor(self):
        return self.picture_desc


class SSTPhoto(db.Model):
    __tablename__ = 'sst_photos'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    slug = db.Column(db.String(), nullable=False)  # Name used in urls
    file_name = db.Column(db.String())
    folder_name = db.Column(db.String())
    caption = db.Column(db.String(512))
    alt_text = db.Column(db.String(256))  # Use if picture does not exist
    json_metadata = db.Column(UnicodeText)
    image_date = db.Column(db.DateTime, default=dt.now())
    metadata_update = db.Column(db.DateTime)

    def add_to_db(self, db_exec, commit=False):
        session = db_exec.get_db_session()
        session.add(self)
        if commit:
            session.commit()
        return self

    def get_json_descriptor(self):
        res = jsm.make_json_descriptor('Photo', jsm.descriptor_picture_fields)
        res['id'] = self.id
        res['url'] = self.get_photo_url(self.id)
        res['caption'] = self.caption
        res['alt_text'] = self.alt_text
        return res


class PhotoMeta(db.Model):
    __tablename__ = 'photo_meta'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    gallery_id = db.Column(db.ForeignKey('photo_gallery.id'), nullable=False)
    meta_key = db.Column(db.String(128), nullable=False)
    meta_value = db.Column(db.String(), nullable=True)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    def __repr__(self):
        return '<Flask PhotoGalleryMeta {}>'.format(self.__tablename__)


def get_html(self):
    res = run_jinja_template('base/picture.jinja2', context=self.get_json_descriptor())
    return res


def __repr__(self):
    return '<Flask PhotoGallery {}>'.format(self.__tablename__)


class PhotoExif(object):
    """A class for working with the photo metadata."""

    def __init__(self, db_exec, photo_id: int, filepath=None):
        self.photo_mgr = db_exec.create_sst_photo_manager()
        if filepath:
            self.filepath = filepath
        else:
            self.filepath = self.photo_mgr.get_photo_file_path(photo_id)
        with open(self.filepath, 'rb') as fl:
            self.tags = exifread.process_file(fl, details=False, debug=Config.DEBUG)

    def print_tags(self):
        for key, val in self.tags.items():
            if key not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
                print(f'Tag: {key}: Value: {val}')

    def get_tags(self):
        return self.tags

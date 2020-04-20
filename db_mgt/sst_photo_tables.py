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
from utilities.miscellaneous import run_jinja_template
from utilities.sst_exceptions import PhotoHandlingError
from utilities.sst_exceptions import PhotoOrGalleryMissing
from .base_table_manager import BaseTableManager
from .json_tables import JSONStorageManager as jsm
from .photo_tables import SlideShow
from db_mgt.pa_db_connect_problems import TestPADB

json_metadata_descriptor = {"title": None, "photographer": None, "people": [],
                            "keywords": None, "xxx": None}


class SSTPhotoManager(BaseTableManager):
    """Manager to control access to Photos, Slideshows, and Galleries

    """

    def __init__(self, db_session):
        super().__init__(db_session)
        self.get_photo_field_value = self.get_table_value('sst_photos')

    def ensure_folder_exists(self, folder: str) -> None:
        """Create a folder in the PHOTO directory if it does not already exist."""
        try:
            foo = TestPADB()                                                # Remove???  ###########
            foo.test_connection()                                           # Ditto
            directory = Config.UPLOADED_PHOTOS_DEST + folder
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
            sys.stdout.flush()                                      # Remove ########################################
            raise e

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

    def update_metadata(self, photo_id: int, caption: str, alt_text: str,  new_metadata: str) -> bool:
        sql = text(f'update sst_photos set json_metadata = :j, caption = :c, alt_text = :a where id= {photo_id}')
        try:
            self.db_session.execute(sql, params=dict(j=new_metadata, c=caption, a=alt_text))
            self.db_session.commit()
            return True
        except Exception as e:
            # LOG ERROR
            return False

    def get_photo_from_slug(self, slug):
        sql = f'select * from sst_photo where slug="{slug}"'
        return self._get_photo(sql)

    def get_photo_from_id(self, photo_id):
        sql = f'select * from sst_photo where id={photo_id};'
        return self._get_photo(sql)

    def _get_photo(self, sql):
        res = self.db_session.execute(sql).first()
        if res:
            gv = self.get_photo_field_value(res)
            photo = SSTPhoto(id=gv('id'), slug=gv('slug'), folder=gv('folder'),
                             file_name=gv('file_name'), image_date=gv('image_date'), meta_data=gv('meta_data'))
            return photo
        else:
            # Missing photo - return dummy
            photo = SSTPhoto(id=0, slug='no-slug', file_name='no_such_file', image_date=None, meta_data=None)
            return photo

    def get_photo_from_path(self, path):
        photo_path = path.split('/')
        filename = photo_path[-1]
        folder = photo_path[-2]

        try:
            sql = 'SELECT *  FROM sst_photo '
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
        sql = f'select * from sst_photo where folder={folder_name}'
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
            temp = self.get_photo_file_path(photo_id)
            if temp:
                url = url_for('admin_bp.get_image', image_path=temp)
                return url
            return None
        except Exception as e:
            raise e

    def get_photo_file_path(self, photo_id):
        try:
            photo = self.get_photo_from_id(photo_id)
            if photo:
                return Config.UPLOADED_PHOTOS_DEST + photo.folder + '/' + photo.file_name
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

    def get_html(self):
        res = run_jinja_template('base/picture.jinja2', context=self.get_json_descriptor())
        return res

    def __repr__(self):
        return '<Flask PhotoGallery {}>'.format(self.__tablename__)


class PhotoExif(object):
    """A class for working with the photo metadata."""

    def __init__(self, db_exec, photo_id: int, filepath=None):
        self.photo_mgr = db_exec.create_photo_manager()
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

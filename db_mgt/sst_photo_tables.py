from io import BytesIO
import os
import sys
from datetime import datetime as dt
from config import Config

from PIL import Image
import exifread
from flask import url_for, render_template
from sqlalchemy import UnicodeText, text

from config import Config, DevConfig
from ssfl import db
from utilities.miscellaneous import run_jinja_template, make_db_search_string
from utilities.sst_exceptions import PhotoHandlingError
from utilities.sst_exceptions import PhotoOrGalleryMissing
from .base_table_manager import BaseTableManager
from .json_tables import JSONStorageManager as jsm
from db_mgt.pa_db_connect_problems import TestPADB
from random import randint
from ssfl import sst_syslog

json_metadata_descriptor = {"title": None, "photographer": None, "people": [],
                            "keywords": None, "xxx": None}


class SSTPhotoManager(BaseTableManager):
    """Manager to control access to Photos, Slideshows, and Galleries

    """

    def __init__(self, db_session):
        super().__init__(db_session)
        self.get_photo_field_value = self.get_table_value('sst_photos')

    def get_photo_generator(self, folder=None):
        try:
            if folder:
                sql = f'select id from sst_photos where folder_name = {folder};'
            else:
                sql = f'select id from sst_photos;'
            all_ids = self.db_session.execute(sql).fetchall()
            for pid in all_ids:
                yield self.get_photo_from_id(pid[0])
        except Exception as e:
            raise e

    def ensure_folder_exists(self, directory: str) -> None:
        """Create a folder in the PHOTO directory if it does not already exist."""
        try:
            foo = TestPADB()  # Remove???  ###########
            foo.test_connection()  # Ditto
            if os.path.exists(directory):
                return False
            else:
                os.mkdir(directory.lower())
                return True
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
            # print(f'Failure going to database: {sys.exc_info()}')  # Remove
            # sys.stdout.flush()  # Remove ########################################
            raise e

    def get_photo_by_slug_if_exists(self, slug):
        """Get photo from slug or return False"""
        try:
            photo = self.db_session.query(SSTPhoto).filter(SSTPhoto.slug == slug).first()
            if photo:
                return photo
            else:
                return False
        except Exception as e:
            # print(f'Failure going to database: {sys.exc_info()}')  # Remove
            # sys.stdout.flush()  # Remove ########################################
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

    def delete_photo(self, photo_id, commit=True):
        photo = self.get_photo_by_id_if_exists(photo_id)
        if photo:
            sql = f'delete from sst_photos where id={photo_id}'
            self.db_session.execute(sql)
            if commit:
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
        pid = photo_id
        if photo_id < 10000:                # TODO: Remove after migration complete
            pid = self.get_new_photo_id_from_old(photo_id)
        sql = f'select * from sst_photos where id={pid};'
        return self._get_photo(sql)

    def _get_photo(self, sql):
        try:
            res = self.db_session.execute(sql).first()
            if res:
                gv = self.get_photo_field_value(res)
                photo = SSTPhoto(id=gv('id'), old_id=gv('old_id'), slug=gv('slug'), folder_name=gv('folder_name'),
                                 caption=gv('caption'), alt_text=gv('alt_text'), file_name=gv('file_name'),
                                 image_date=gv('image_date'),  json_metadata=gv('json_metadata'))
                return photo
            else:
                raise
        except Exception as e:
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
            photo_id, slug, file_name, folder, meta_data, image_date = res
            photo.id = photo_id
            photo.slug = slug
            photo.file_name = file_name
            photo.folder = folder
            photo.image_date = image_date
            photo.meta_data = meta_data
            return photo
        except Exception as e:
            raise SystemError(f'Failure retrieving photo {photo_path}')

    def get_photos_in_folder(self, folder_name):
        sql = f'select * from sst_photos where folder_name="{folder_name}/"'
        sql_res = self.db_session.execute(sql).fetchall()
        res = []
        for row in sql_res:
            gv = self.get_photo_field_value(row)
            photo = SSTPhoto(id=gv('id'), old_id=gv('old_id'), slug=gv('slug'), folder_name=gv('folder_name'),
                             file_name=gv('file_name'),
                             image_date=gv('image_date'), json_metadata=gv('json_metadata'))
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
            # We need to defend against missing photos.  In particular, a reimport of photos from Wordpress
            # causes photo_ids to change, but photo_ids are already buried in JSON strings in the database.
            # As a last ditch defense, we substitute a dummy photo to allow the system to continue.
            photo = self.get_photo_from_id(photo_id)
            if photo and photo.folder_name:
                if photo.folder_name.endswith('/'):
                    return photo.folder_name + photo.file_name
                else:
                    # This should not be necessary, but we may be inconsistent.
                    return photo.folder_name + '/' + photo.file_name
            else:
                sst_syslog.make_error_entry(f'Missing photo.  ID requested: {photo_id}')
                # TODO:  Make dummy photo to use for missing photo
                photo_slug = 'img_8904'
                photo = self.get_photo_by_slug_if_exists(photo_slug)
                return self.get_photo_folder_and_name(photo.id)
        except Exception as e:
            raise e

    def get_photo_ids_in_gallery_with_id(self, gallery_id, old_id=False):
        # To map old gallery ids - we have to convert the gallery and look it up in Photo to get the slug
        # we can use to find the new photo_id.  It really doesn't make sense to try to look up the new_gallery id
        # as we don't use galleries and it is just a hook to get from the old ones
        gal_id = gallery_id
        if old_id:
            sql = f'select photo_gallery_id from v_photo_gallery_gallery where wp_gallery_id={gal_id}'
            gal_id = self.db_session.execute(sql).first()[0]
        sql = f'select image_slug from photo where gallery_id={gal_id}'
        res = self.db_session.execute(sql).fetchall()
        all_ids = []
        for slug in res:
            sql = f'select id from sst_photos where slug="{slug[0]}"'
            new_id = self.db_session.execute(sql).first()[0]
            all_ids.append(new_id)
        return all_ids




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
        """
        sql = f'select id from sst_photos where old_id={old_id};'
        new_id = self.db_session.execute(sql).first()
        if new_id:
            return new_id[0]
        else:
            return None

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
        sql = f'select id from sst_photos where '
        if search_string:
            sql += f'{field} like lower("{search}") '
        if search_string and folder_search:
            sql += f'and '
        if folder_search:
            find_folder = make_db_search_string(folder_search.lower())
            sql += f'folder_name like lower("{find_folder}") '
        if not (search_string or folder_search):
            return None
        sql += f'order by image_date desc limit {nbr_to_get}'
        res = self.db_session.execute(sql)
        photos = []
        for ndx in res:
            new_photo = self.get_photo_by_id_if_exists(ndx[0])
            photos.append(new_photo)
        return photos

    def generate_photo_records(self, key_list):
        res = self.db_session.query(SSTPhoto).all()
        for record in res:
            rec = record.__dict__
            rec_list = []
            for key in key_list:
                rec_list.append(rec[key])
            yield rec_list


class SlideShow(object):
    """
    Collection of photos rendered by template to produce html for slideshow.
    """

    def __init__(self, name, db_exec):
        # ['SLIDESHOW', 'name', 'title', 'title_class', 'position', 'width', 'height', 'rotation', 'frame_title', 'pictures']
        self.db_exec = db_exec
        self.json_store_manager = db_exec.create_json_manager()
        self.photo_manager = db_exec.create_sst_photo_manager()
        self.show_desc = self.json_store_manager.get_json_from_name('P_SLIDESHOW')
        self.show_desc['name'] = name
        self.show_desc['title'] = ''
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
            if desc['url']:                             # Pic may be proven to exist at this point??
                desc['exists'] = True                   # Will display alt-text in event pic not loadable
            else:
                desc['exists'] = False
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

    def get_position(self):
        if 'position' in self.show_desc:
            return self.show_desc['position']
        else:
            return None

    def set_rotation(self, rotation):
        self.show_desc['rotation'] = rotation

    def set_dimension(self, dimension, size):
        if dimension == 'width':
            self.show_desc['width'] = size
        else:
            self.show_desc['height'] = size

    def get_html(self, float_dir=None, build_for_wordpress=False):
        wt = self.show_desc['width']
        ht = self.show_desc['height']
        if type(ht) is str:
            self.show_desc['frame_ht'] = str(int(ht) + 40)
        else:
            self.show_desc['frame_ht'] = ht + 40
        for photo in self.show_desc['pictures']:
            photo['width'] = wt
            photo['height'] = ht
            photo['wordpress'] = build_for_wordpress
            # If a caption was provided in the template, it was stored as the caption for the Slideshow since
            # the photo was not itself available at the time for such storage.
            # --- Is there a problem in the case of multiple pics in a slideshow - this presumes the slideshow
            # caption is supposed to win.
            if not 'caption' in self.show_desc or self.show_desc['caption'] is None:
                if 'caption' in photo and photo['caption'] is not None:
                    self.show_desc['caption'] = photo['caption']
            else:
                for pic in self.show_desc['pictures']:
                    pic['caption'] = self.show_desc['caption']
        context = {'carousel': self.show_desc}
        if float_dir:
            context['float_dir'] = f'style="float:{float_dir}"'
        else:
            context['float_dir'] = ''
        context['unique_id_base'] = 'X' + str(randint(1, 10000))    # This must be unique for slideshows in a single page
                                                                    #  - this supports bootstraps carousel when needs a unique id
        try:
            self.html = render_template('base/carousel.jinja2', **context)
        except Exception as e:
            foo = 3
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
            wp_url = self._add_wp_url(photo_id, db_photo.old_id,  db_photo.folder_name)          # REMOVE WHEN WP SITE NO LONGER NEEDED
            if wp_url:
                self.picture_desc['wp_url'] = wp_url
                self.picture_desc['wp_exists'] = True
            else:
                self.picture_desc['wp_exists'] = False
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

    def _add_wp_url(self, photo_id, old_id, gallery):
        """Add url for use on WP site - remove this function when site not needed."""
        if old_id:
            sql = f'select filename from wp_ngg_pictures where pid={old_id};'
            res = self.db_exec.db_session.execute(sql).first()
            if res:
                filename = res[0]
                url = f'https://sunnyside-times.com/wp-content/gallery/{gallery}/{filename}'
                return url
        return None


    def get_picture_location(self):
        return self.picture_desc['url']

    def get_picture_descriptor(self):
        return self.picture_desc


class SSTPhoto(db.Model):
    __tablename__ = 'sst_photos'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    old_id = db.Column(db.Integer)
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
    # gallery_id = db.Column(db.ForeignKey('photo_gallery.id'), nullable=False)
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
            self.tags = exifread.process_file(fl, details=False, debug=DevConfig.DEBUG)

    def print_tags(self):
        for key, val in self.tags.items():
            if key not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
                print(f'Tag: {key}: Value: {val}')

    def get_tags(self):
        return self.tags

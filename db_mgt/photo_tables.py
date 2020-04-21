import os
from io import BytesIO

from PIL import Image
from flask import url_for, render_template
from sqlalchemy import UnicodeText

from config import Config
from ssfl import db
from utilities.miscellaneous import run_jinja_template
from utilities.sst_exceptions import PhotoHandlingError
from utilities.sst_exceptions import PhotoOrGalleryMissing
from .base_table_manager import BaseTableManager
from .json_tables import JSONStorageManager as jsm


class PhotoManager(BaseTableManager):
    """Manager to control access to Photos, Slideshows, and Galleries

    """

    def __init__(self, db_session):
        raise SystemError("Not using this Photo Manager Anymore")
        super().__init__(db_session)
        self.get_photo_field_value = self.get_table_value('photo')
        self.get_gallery_field_value = self.get_table_value('photo_gallery')

    def get_slideshow(self, db_exec, show_name='NEED PHOTO NAME'):
        slideshow = SlideShow(show_name, db_exec)
        return slideshow

    def get_photo_from_slug(self, slug):
        sql = f'select * from photo where image_slug="{slug}"'
        return self._get_photo(sql)

    def get_photo_from_id(self, photo_id):
        if photo_id < 10000:
            # This is an old photo ID
            # TODO: Remove this leg of test when all photos have been imported and old links removed
            sql = f'select * from photo ph join v_photo_picture pp '
            sql += f'where pp.photo_id = ph.id and pp.wp_picture_id = {photo_id};'
        else:
            sql = f'select * from photo where id={photo_id};'
        return self._get_photo(sql)

    def _get_photo(self, sql):
        res = self.db_session.execute(sql).first()
        if res:
            gv = self.get_photo_field_value(res)
            photo = Photo(id=gv('id'), image_slug=gv('image_slug'), gallery_id=gv('gallery_id'),
                          file_name=gv('file_name'), caption=gv('caption'), alt_text=gv('alt_text'),
                          image_date=gv('image_date'), meta_data=gv('meta_data'))
            return photo
        else:
            # Missing photo - return dummy
            photo = Photo(id=0, image_slug='no-slug', gallery_id=0,
                          file_name='no_such_file', caption='Photo Missing', alt_text='Photo Missing',
                          image_date=None, meta_data=None)
            return photo

    def get_photo_from_path(self, path):
        photo_path = path.split('/')[-1]
        # TODO: Determine if this code is really broken????
        multi_try = 3  # Acts as if there may be a race condition - trying multiple times before failure
        while multi_try > 0:
            try:
                sql = 'SELECT *  FROM photo '
                sql += f'WHERE file_name = "{photo_path}";'
                photo = Photo()
                res = self.db_session.execute(sql).first()
                photo_id, image_slug, gallery_id, file_name, caption, \
                alt_text, image_date, meta_data = res
                photo.id = photo_id
                photo.image_slug = image_slug
                photo.gallery_id = gallery_id
                photo.file_name = file_name
                photo.caption = caption
                photo.alt_text = alt_text
                photo.image_date = image_date
                photo.meta_data = meta_data
                return photo
            except Exception as e:
                multi_try -= 1
                if not multi_try:
                    raise ValueError(f'Multiple Failures retrieving photo {photo_path}')


    def get_gallery_by_id(self, pid):
        # This is new gallery_id
        sql = f'select * from photo_gallery where id={pid}'
        res = self.db_session.execute(sql).first()
        if res:
            gv = self.get_gallery_field_value(res)
            gallery = PhotoGallery(id=gv('id'), name=gv('name'),
                                   slug_name=gv('slug_name'), path_name=gv('path_name'))
            return gallery
        return None

    def get_photos_in_gallery_with_id(self, pid):
        sql = f'select * from photo where gallery_id={pid}'
        sql_res = self.db_session.execute(sql).all()
        res = []
        for row in sql_res:
            gv = self.get_photo_field_value(row)
            photo = Photo(id=gv('id'), image_slug=gv('image_slug'), gallery_id=gv('gallery_id'),
                          file_name=gv('file_name'), caption=gv('caption'), alt_text=gv('alt_text'),
                          image_date=gv('image_date'), meta_data=gv('meta_data'))
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
            foo = 3
            raise e

    def get_photo_file_path(self, photo_id):
        try:
            photo = self.get_photo_from_id(photo_id)
            gallery_id = photo.gallery_id
            if gallery_id:
                gallery = self.get_gallery_by_id(gallery_id)
                # A url suitable for appending to the url_root of a request
                temp = gallery.path_name + photo.file_name
                return temp
            else:
                return None
        except Exception as e:
            foo = 3
            raise e

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
            foo = 3
            raise e
        except Exception as e:
            foo = 3
            raise e


class Photo(db.Model):
    __tablename__ = 'photo'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    image_slug = db.Column(db.String(), nullable=False)  # Name used in urls
    gallery_id = db.Column(db.Integer, db.ForeignKey('photo_gallery.id'), nullable=True)
    file_name = db.Column(db.String())
    caption = db.Column(db.String(512))
    alt_text = db.Column(db.String(256))  # Use if picture does not exist
    image_date = db.Column(db.DateTime)
    meta_data = db.Column(UnicodeText)

    def add_to_db(self, session, commit=False):
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


class XPhotoMeta(db.Model):
    __tablename__ = 'Xphoto_meta'
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


class PhotoGallery(db.Model):
    __tablename__ = 'photo_gallery'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(), nullable=False)  # Name of gallery
    slug_name = db.Column(db.String(), nullable=False)  # Name used in urls
    path_name = db.Column(db.String(), nullable=False)  # File location (ends with '/'), append to top-level location

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    def __repr__(self):
        return '<Flask PhotoGallery {}>'.format(self.__tablename__)


class PhotoGalleryMeta(db.Model):
    __tablename__ = 'photo_gallery_meta'
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
        new_photo = Picture(self.db_exec, photo_id)  # make call as self.photo_manager(photo_id)
        desc = new_photo.get_picture_descriptor()
        # When the photo description is encountered, the picture descriptor does not exist.  However, it
        # will exist before another photo is encountered.  Therefore, we use a caption field on the slideshow
        # descriptor as a temporary location to pass the caption to the picture.
        if 'caption' in self.show_desc and self.show_desc['caption']:
            desc['caption'] = self.show_desc['caption']
            self.show_desc['caption'] = None
        self.show_desc['pictures'].append(desc)

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
        if res:
            db_photo = res
            gallery_id = db_photo.gallery_id
            file_name = db_photo.file_name
            self.picture_desc['alt_text'] = db_photo.alt_text
            self.picture_desc['caption'] = db_photo.caption
            db_gallery = self.picture_manager.get_gallery_by_id(gallery_id)
            if db_gallery:
                path = db_gallery.path_name
                relative_path = '/static/gallery/' + path + file_name
                self.picture_desc['url'] = relative_path
            else:
                raise PhotoOrGalleryMissing(f'PhotoGalley {gallery_id} for photo {photo_id} does not exist in database.')
        else:
            raise PhotoOrGalleryMissing(f'Photo {photo_id} does not exist in database.')

    def get_picture_location(self):
        return self.picture_desc['url']

    def get_picture_descriptor(self):
        return self.picture_desc




from sqlalchemy import UnicodeText
from sqlalchemy.exc import InterfaceError
from ssfl import db
from config import Config
from PIL import Image
from utilities.miscellaneous import get_temp_file_name
from .json_tables import JSONStorageManager as jsm


class Photo(db.Model):
    __tablename__ = 'photo'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    old_id = db.Column(db.Integer, nullable=False)
    image_slug = db.Column(db.String(), nullable=False)    # Name used in urls
    gallery_id = db.Column(db.Integer, db.ForeignKey('photo_gallery.id'), nullable=True)
    old_gallery_id = db.Column(db.Integer)
    file_name = db.Column(db.String())
    caption = db.Column(db.String(512))
    alt_text = db.Column(db.String(256))          # Use if picture does not exist
    image_date = db.Column(db.DateTime)
    meta_data = db.Column(UnicodeText)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    @staticmethod
    def get_photo_url(session, photo_id):      # TODO: replace to use current id
        try:
            photo = session.query(Photo).filter(Photo.old_id == photo_id).first()
            gallery_id = photo.old_gallery_id
            gallery = session.query(PhotoGallery).filter(PhotoGallery.old_id == gallery_id).first()
            # A url suitable for appending to the url_root of a request
            url = gallery.path_name + photo.file_name
            return url
        except InterfaceError as e:
            return None
        except Exception as e:
            foo = 3
            raise e

    def get_resized_photo(self, session, width=None, height=None):
        """Get  resized copy of self photo into temporary file.
        """
        try:
            file = Config.USER_DIRECTORY_IMAGES + Photo.get_photo_url(session, self.old_id)
        except Exception as e:
            foo = 3
        try:
            image = Image.open(file)
            print(f'Image Size {image.size}')
            image.thumbnail((width, height))
        except Exception as e:
            foo = 3
        fl = get_temp_file_name('photo', 'jpg')
        try:
            image.save(fl)
        except Exception as e:
            foo = 3
        return fl

    @staticmethod
    def get_photo_from_path(session, path):
        photo_path = path.split('/')[-1]
        multi_try = 3               # May be a race condition - trying multiple times before failure
        while multi_try > 0:
            try:
                photo = session.query(Photo).filter(Photo.file_name == photo_path).first()
                return photo
            except Exception as e:
                multi_try -= 1
                if not multi_try:
                    raise ValueError(f'Multiple Failures retrieving photo {photo_path}')

    def get_json_descriptor(self):
        res = jsm.make_json_descriptor('Photo', jsm.descriptor_photo_fields)
        res['id'] = self.id
        res['url'] = self.get_photo_url(self.id)
        res['caption'] = self.caption
        res['alt_text'] = self.alt_text
        return res

    def __repr__(self):
        return '<Flask PhotoGallery {}>'.format(self.__tablename__)


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


class PhotoGallery(db.Model):
    __tablename__ = 'photo_gallery'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    old_id = db.Column(db.Integer)
    name = db.Column(db.String(), nullable=False)         # Name of gallery
    slug_name = db.Column(db.String(), nullable=False)    # Name used in urls
    path_name = db.Column(db.String(), nullable=False)    # File location (ends with '/'), append to top-level location

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
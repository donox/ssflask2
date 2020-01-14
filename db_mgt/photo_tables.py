from sqlalchemy import UnicodeText
from ssfl import db
from config import Config
from PIL import Image


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
        photo = session.query(Photo).filter(Photo.old_id == photo_id).first()
        gallery_id = photo.old_gallery_id
        gallery = session.query(PhotoGallery).filter(PhotoGallery.old_id == gallery_id).first()
        # A url suitable for appending to the url_root of a request
        url = gallery.path_name + photo.file_name
        return url

    def get_resized_photo(self, session, width=None, height=None):
        """Get  resized copy of self photo into temporary file.

        Temporary files are maintained on a rotating basis and reused.  This seems to
        avoid problems managing the closing and deleting of temporary files.
        """
        file = Config.USER_DIRECTORY_IMAGES + Photo.get_photo_url(session, self.old_id)
        image = Image.open(file)
        print(f'Image Size {image.size}')
        image.thumbnail((width, height))
        fl = Config.TEMP_FILE_LOC + 'photo' + str(Config.TEMP_CURRENT) + '.jpg'
        tmp = int(Config.TEMP_CURRENT) + 1
        if tmp > int(Config.TEMP_COUNT):
            tmp = 1
        Config.TEMP_CURRENT = tmp
        image.save(fl)
        return fl

    @staticmethod
    def get_photo_from_path(session, path):
        photo_path = path.split('/')[-1]
        try:
            photo = session.query(Photo).filter(Photo.file_name == photo_path).first()
            return photo
        except:
            return None

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
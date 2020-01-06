from sqlalchemy import Column, ForeignKey, Integer, String, Date, DateTime, Boolean, func, UnicodeText
from application import db


class Photo(db.Model):
    __tablename__ = 'photo'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    old_id = db.Column(db.Integer, nullable=False)
    image_slug = db.Column(db.String(), nullable=False)    # Name used in urls
    gallery_id = db.Column(db.Integer, ForeignKey('photo_gallery.id'), nullable=True)
    old_gallery_id = db.Column(db.Integer)
    file_name = db.Column(db.String())
    caption = db.Column(db.String(512))
    alt_text = db.Column(db.String(256))          # Use if picture does not exist
    image_date = db.Column(DateTime)
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
        url = 'gallery/' + gallery.path_name  + photo.file_name
        return url

    def __repr__(self):
        return '<Flask PhotoGallery {}>'.format(self.__tablename__)


class PhotoMeta(db.Model):
    __tablename__ = 'photo_meta'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    gallery_id = db.Column(ForeignKey('photo_gallery.id'), nullable=False)
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
    gallery_id = db.Column(ForeignKey('photo_gallery.id'), nullable=False)
    meta_key = db.Column(db.String(128), nullable=False)
    meta_value = db.Column(db.String(), nullable=True)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    def __repr__(self):
        return '<Flask PhotoGalleryMeta {}>'.format(self.__tablename__)
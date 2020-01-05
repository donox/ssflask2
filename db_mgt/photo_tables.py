from sqlalchemy import Column, ForeignKey, Integer, String, Date, DateTime, Boolean, func, UnicodeText
from application import Base


class Photo(Base):
    __tablename__ = 'photo'
    _instances_ = {}
    id = Column(Integer, primary_key=True, autoincrement=True)
    old_id = Column(Integer, nullable=False)
    image_slug = Column(String(), nullable=False)    # Name used in urls
    gallery_id = Column(Integer, ForeignKey('photo_gallery.id'), nullable=True)
    old_gallery_id = Column(Integer)
    file_name = Column(String())
    caption = Column(String(512))
    alt_text = Column(String(256))          # Use if picture does not exist
    image_date = Column(DateTime)
    meta_data = Column(UnicodeText)

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


class PhotoMeta(Base):
    __tablename__ = 'photo_meta'
    _instances_ = {}
    id = Column(Integer, primary_key=True, autoincrement=True)
    gallery_id = Column(ForeignKey('photo_gallery.id'), nullable=False)
    meta_key = Column(String(128), nullable=False)
    meta_value = Column(String(), nullable=True)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    def __repr__(self):
        return '<Flask PhotoGalleryMeta {}>'.format(self.__tablename__)


class PhotoGallery(Base):
    __tablename__ = 'photo_gallery'
    _instances_ = {}
    id = Column(Integer, primary_key=True, autoincrement=True)
    old_id = Column(Integer)
    name = Column(String(), nullable=False)         # Name of gallery
    slug_name = Column(String(), nullable=False)    # Name used in urls
    path_name = Column(String(), nullable=False)    # File location (ends with '/'), append to top-level location

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    def __repr__(self):
        return '<Flask PhotoGallery {}>'.format(self.__tablename__)


class PhotoGalleryMeta(Base):
    __tablename__ = 'photo_gallery_meta'
    _instances_ = {}
    id = Column(Integer, primary_key=True, autoincrement=True)
    gallery_id = Column(ForeignKey('photo_gallery.id'), nullable=False)
    meta_key = Column(String(128), nullable=False)
    meta_value = Column(String(), nullable=True)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            session.commit()
        return self

    def __repr__(self):
        return '<Flask PhotoGalleryMeta {}>'.format(self.__tablename__)
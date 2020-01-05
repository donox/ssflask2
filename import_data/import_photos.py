import csv
from db_mgt.photo_tables import PhotoGallery, Photo

# These are needed when running standalone
from pathlib import Path
from dotenv import load_dotenv
env_path = '/home/don/devel/ssflask/.env'
load_dotenv(dotenv_path=env_path)
import db_mgt.setup as su


class ImportPhotoData(object):
    """Set up directories and supporting DB tables"""
    def __init__(self, session, galleryfile, photofile):
        self.session = session
        self.galleryfile = galleryfile
        self.photofile = photofile

    def read_file(self, file):
        with open(file, 'r') as csv_in:
            csv_reader = csv.reader(csv_in)
            for line in csv_reader:
                yield line

    # This is assuming both tables are empty
    def update_photos_and_galleries(self):
        for line in self.read_file(self.galleryfile):
            try:
                gallery_id, name, slug, path, title, _, _, _, _, _ = line
                new_rec = PhotoGallery()
                new_rec.old_id = gallery_id
                new_rec.name = name
                new_rec.slug_name = slug
                rem_path = path.split('gallery/')[-1]       # take path after .../gallery/
                if rem_path[-1] != '/':                 # ensure this is a directory
                    rem_path += '/'
                new_rec.path_name = rem_path
                new_rec.add_to_db(self.session, commit=True)
            except Exception as e:
                print(e)
                raise e
        for line in self.read_file(self.photofile):
            try:
                photo_id, slug, _, gallery, file, desc, alttext, imagedate, _, _, metadata, _, _ = line
                new_rec = Photo()
                new_rec.old_id = photo_id
                new_rec.image_slug = slug
                new_rec.old_gallery_id = gallery
                new_rec.file_name = file
                new_rec.caption = desc[0:512]
                new_rec.alt_text = alttext[0:256]
                new_rec.image_date = imagedate
                new_rec.metadata = metadata
                new_rec.add_to_db(self.session, commit=True)
            except Exception as e:
                print(e)
                raise e



if __name__ == '__main__':
    df_gallery = '/home/don/devel/ngg_gallery.csv'
    df_photo = '/home/don/devel/ngg_pictures.csv'
    engine = su.get_engine()
    session = su.create_session(engine)
    tables = su.create_tables(engine)
    ipd = ImportPhotoData(session, df_gallery, df_photo)
    print("Start update_db")
    ipd.update_photos_and_galleries()


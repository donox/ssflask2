import unidecode
from db_mgt.sst_photo_tables import SSTPhotoManager, SSTPhoto
from db_mgt.db_exec import DBExec
from config import Config
import os
from config import Config


class ImportPhotoData(object):
    """
    Route: '/admin/sst_import_database' = > db_import_pages
    Template: import_database_functions.jinja2
    Form: import_database_functions_form.py
    Processor: db_import_pages.py
    """

    def __init__(self, db_exec: DBExec, current_form):
        self.db_session = db_exec.get_db_session()
        self.db_exec = DBExec()
        self.wp_gallery_fields = self.get_table_fields('wp_ngg_gallery')
        self.wp_picture_fields = self.get_table_fields('wp_ngg_pictures')
        self.photo_fields = self.get_table_fields('photo')
        self.photo_gallery_fields = self.get_table_fields('photo_gallery')
        self.galleries = dict()
        self.db_exec.set_current_form(current_form)

    def get_field_index(self, field, table):
        """Get index of field that will correspond to DB row value.

        Args:
            field(str): Name of field to find
            table(str): Name of table containing field

        Returns:
            int: index of field
        """
        if table == 'wp_ngg_gallery':
            field_list = self.wp_gallery_fields
        elif table == 'wp_ngg_pictures':
            field_list = self.wp_picture_fields
        elif table == 'photo':
            field_list = self.photo_fields
        elif table == 'photo_gallery':
            field_list = self.photo_gallery_fields
        else:
            raise SystemError(f'Unrecognized table: {table}')
        ndx = field_list.index(field)
        return ndx

    def get_table_fields(self, table: str):
        """Get list of fields in a MySQL table.

        Args:
            table: Name of table

        Returns(list): list of table field names

        """
        sql = f'DESCRIBE {table};'
        res = self.db_session.execute(sql)
        fields = [x[0].lower() for x in res.fetchall()]
        return fields

    def get_wp_gallery_data(self):
        """Generator for row of data from wp_ngg_gallery table.

        Returns(list(tuple)):  List of tuples containing {field name: value}

        """
        sql = 'SELECT * from wp_ngg_gallery;'
        res = self.db_session.execute(sql).fetchall()
        for row in res:
            yield row

    def get_wp_picture_data(self):
        """Generator for row of data from wp_ngg_pictures table.

        Returns(list(tuple)):  List of tuples containing {field name: value}

        """
        sql = 'SELECT * from wp_ngg_pictures;'
        res = self.db_session.execute(sql).fetchall()
        for row in res:
            yield row

    def get_row_from_gallery_id(self, row_id):
        """Get specific row of data from wp_ngg_gallery.

            Returns(list):  List of values of fields.
        """
        sql = f'SELECT * from wp_ngg_gallery  where ID= {row_id};'
        res = self.db_session.execute(sql).first();
        return res

    def get_row_from_photo_id(self, row_id):
        """Get specific row of data from wp_ngg_pictures

            Returns(list):  List of values of fields.
        """
        sql = f'SELECT * from wp_ngg_pictures  where ID= {row_id};'
        res = self.db_session.execute(sql).first();
        return res

    def import_all_galleries(self):
        max_gallery = 50000
        field_gallery_name = self.get_field_index('name', 'wp_ngg_gallery')
        field_gallery_id = self.get_field_index('gid', 'wp_ngg_gallery')
        field_slug_name = self.get_field_index('slug', 'wp_ngg_gallery')
        field_path_name = self.get_field_index('path', 'wp_ngg_gallery')
        for gallery_row in self.get_wp_gallery_data():
            wp_id = gallery_row[field_gallery_id]
            if wp_id < max_gallery:
                name = gallery_row[field_gallery_name]
                slug = gallery_row[field_slug_name]
                path = gallery_row[field_path_name]
                rem_path = path.split('gallery/')[-1]  # take path after .../gallery/
                if rem_path[-1] != '/':  # ensure this is a directory
                    rem_path += '/'
                self.galleries[wp_id] = {'name': name, 'slug': slug, 'path': path, 'rem_path': rem_path}

    def import_all_photos(self):
        """Update sst_photos in database and verify existence.

        Scan all photos in wp_database (presume already imported as corresponding WP tables).  Any
        entries that already exist are unchanged.  Any entries that are new are added.  Each photo path
        is verified."""
        photo_mgr = self.db_exec.create_sst_photo_manager()
        field_photo_filename = self.get_field_index('filename', 'wp_ngg_pictures')
        field_photo_id = self.get_field_index('pid', 'wp_ngg_pictures')
        field_photo_slug = self.get_field_index('image_slug', 'wp_ngg_pictures')
        field_photo_description = self.get_field_index('description', 'wp_ngg_pictures')
        field_photo_alttext = self.get_field_index('alttext', 'wp_ngg_pictures')
        field_photo_imagedate = self.get_field_index('imagedate', 'wp_ngg_pictures')
        field_photo_meta_data = self.get_field_index('meta_data', 'wp_ngg_pictures')
        field_gallery_id = self.get_field_index('galleryid', 'wp_ngg_pictures')
        for photo_row in self.get_wp_picture_data():
            wp_id = photo_row[field_photo_id]
            new_id = photo_mgr.get_new_photo_id_from_old(wp_id)
            if not new_id:
                filename = photo_row[field_photo_filename]
                slug = photo_row[field_photo_slug]
                gal_id = photo_row[field_gallery_id]
                if gal_id in self.galleries:
                    gallery_res = self.galleries[gal_id]
                    caption = photo_row[field_photo_description][0:512]
                    alt_text = photo_row[field_photo_alttext][0:256]
                    imagedate = photo_row[field_photo_imagedate]
                    metadata = photo_row[field_photo_meta_data]
                    if len(metadata) > 2000:
                        metadata = ''
                    pho = SSTPhoto(old_id=wp_id, slug=slug, folder_name=gallery_res['rem_path'], file_name=filename,
                                   caption=caption,
                                   alt_text=alt_text, image_date=imagedate, json_metadata=metadata,
                                   metadata_update=None)
                    pho.add_to_db(self.db_exec, commit=True)
                else:
                    msg = f'Photo: {slug} with ID: {wp_id} has no gallery.'
                    self.db_exec.add_error_to_form('Missing gallery', msg)
                    print(msg)
        # Verify that entries have an actual photo
        for photo in photo_mgr.get_photo_generator():
            path_name = Config.USER_DIRECTORY_IMAGES + photo.folder_name
            file_name = path_name + photo.file_name
            if not (photo.file_name and os.path.isdir(path_name) and os.path.isfile(file_name)):
                print(f'Deleting {photo.slug} : id: {photo.id}')
                self.db_exec.add_error_to_form('Missing photo', f'No photo: {photo.slug} - removed from sst_photos')
                photo_mgr.delete_photo(photo.id, commit=False)
        self.db_exec.db_session.commit()

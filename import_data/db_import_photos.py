from db_mgt.page_tables import Page
import urllib.parse as uparse
import unidecode
from db_mgt.photo_tables import PhotoGallery, PhotoManager, Photo


class ImportPhotoData(object):
    """
    Route: '/admin/sst_import_database' = > db_import_pages
    Template: import_database_functions.jinja2
    Form: import_database_functions_form.py
    Processor: db_import_pages.py
    """

    def __init__(self, db_session):     # TODO:  MODIFY TO USE DBEXEC
        self.db_session = db_session
        self.wp_gallery_fields = self.get_table_fields('wp_ngg_gallery')
        self.wp_picture_fields = self.get_table_fields('wp_ngg_pictures')
        self.photo_fields = self.get_table_fields('photo')
        self.photo_gallery_fields = self.get_table_fields('photo_gallery')

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
        field_gallery_name = self.get_field_index('name', 'wp_ngg_gallery')
        field_gallery_id = self.get_field_index('gid', 'wp_ngg_gallery')
        field_slug_name = self.get_field_index('slug', 'wp_ngg_gallery')
        field_path_name = self.get_field_index('path', 'wp_ngg_gallery')
        for gallery_row in self.get_wp_gallery_data():
            name = gallery_row[field_gallery_name]
            slug = gallery_row[field_slug_name]
            wp_id = gallery_row[field_gallery_id]
            path = gallery_row[field_path_name]
            rem_path = path.split('gallery/')[-1]  # take path after .../gallery/
            if rem_path[-1] != '/':  # ensure this is a directory
                rem_path += '/'
            gal = PhotoGallery(name=name, slug_name=slug, path_name=rem_path)
            gal.add_to_db(self.db_session, commit=True)
            new_id = gal.id
            sql = f'insert into v_photo_gallery_gallery (photo_gallery_id, wp_gallery_id ) values ({new_id},{wp_id});'
            self.db_session.execute(sql)
            self.db_session.commit()

    def import_all_photos(self):
        field_photo_filename = self.get_field_index('filename', 'wp_ngg_pictures')
        field_photo_id = self.get_field_index('pid', 'wp_ngg_pictures')
        field_photo_slug = self.get_field_index('image_slug', 'wp_ngg_pictures')
        field_photo_description = self.get_field_index('description', 'wp_ngg_pictures')
        field_photo_alttext = self.get_field_index('alttext', 'wp_ngg_pictures')
        field_photo_imagedate = self.get_field_index('imagedate', 'wp_ngg_pictures')
        field_photo_meta_data = self.get_field_index('meta_data', 'wp_ngg_pictures')
        field_gallery_id = self.get_field_index('galleryid', 'wp_ngg_pictures')
        for photo_row in self.get_wp_picture_data():
            filename = photo_row[field_photo_filename]
            slug = photo_row[field_photo_slug]
            wp_id = photo_row[field_photo_id]
            gal_id = photo_row[field_gallery_id]
            gal_id_sql = f'select photo_gallery_id from v_photo_gallery_gallery where wp_gallery_id={gal_id};'
            gallery_res = self.db_session.execute(gal_id_sql).first()
            if gallery_res:
                # Skip photos not in a gallery
                gallery_id = gallery_res[0]
                caption = photo_row[field_photo_description][0:512]
                alt_text = photo_row[field_photo_alttext][0:256]
                imagedate = photo_row[field_photo_imagedate]
                metadata = photo_row[field_photo_meta_data]
                pho = Photo(image_slug=slug, gallery_id=gallery_id, file_name=filename, caption=caption,
                            alt_text=alt_text, image_date=imagedate, meta_data=metadata,
                            old_id=0, old_gallery_id=0)
                pho.add_to_db(self.db_session, commit=True)
                new_id = pho.id
                sql = f'insert into v_photo_picture (photo_id, wp_picture_id ) values ({new_id},{wp_id});'
                self.db_session.execute(sql)
                self.db_session.commit()
            else:
                print(f'Photo: {slug} with ID: {wp_id} has no gallery.')


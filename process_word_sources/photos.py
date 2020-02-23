from db_mgt.photo_tables import Photo as DBPhoto, PhotoGallery
from config import Config

class PagePhotoFrame(object):
    def __init__(self, name, db_session):
        self.db_session = db_session
        self.name = name
        self.photo_list = []
        self.position = 'center'
        self.width = 300
        self.height = 250
        self.rotation_speed = 3.0
        self.frame_title = ''

    def add_photo(self, photo_id):
        new_photo = Photo(self.db_session, photo_id)
        self.photo_list.append(new_photo)
        return new_photo

    def add_title(self, title):
        self.frame_title = title

    def set_position(self, position):
        self.position = position

    def set_rotation(self, rotation):
        self.rotation_speed = rotation

    def set_dimension(self, dimension, size):
        if dimension == 'width':
            self.width = size
        else:
            self.height = size

    def get_html(self):
        pl = len(self.photo_list)
        if not pl:
            return f'<div>Picture Frame: {self.name} is empty.</div>'
        elif pl == 1:
            html = self._get_single_picture_html(self.photo_list[0], False, '0', True)
            html = html.replace('&w&', str(self.width)).replace('&h&', str(self.height))
        else:
            html = '<div clas="slideshow">'
            first = True
            for pl in self.photo_list:
                html += self._get_single_picture_html(pl, True, str(self.rotation_speed), first)
                first = False
                html = html.replace('&w&', str(self.width)).replace('&h&', str(self.height))
            html += '</div>'
        return html


    def _get_single_picture_html(self, photo, slideshow, rotation, display):
        if display:
            disp = 'block'
        else:
            disp = 'none'
        html = '<div class="singlepic" '
        if self.frame_title:
            html += 'title="' + self.frame_title + '" '
        if photo.caption:
            html += 'caption="' + photo.caption + '" '
        elif photo.alt_text:
            html += 'caption="' + photo.alt_text + '" '
        html += 'interval="' + rotation + '" '
        if slideshow:
            html += 'style="display:' + disp + '" '
        html += '<table class="src-img-table" style="width:&w&px; height:&h&px">'
        html += '<tbody>'
        html += '<tr>'
        html += '<td class="src-img-pic-td">'
        html += '<img class="src-img-frame" src="' + photo.url + '">'
        html += '</td>'
        html += '</tr>'
        html += '</tbody>'
        html += '</table>'
        html += '</div>'
        return html

class Photo(object):
    def __init__(self, db_session, photo_id):
        self.db_session = db_session
        self.id = photo_id
        self.caption = ''
        self.alt_text = ''
        self.url = 'Not Done Yet'
        res = db_session.query(DBPhoto).filter(DBPhoto.id == photo_id)
        if res:
            db_photo = res.first()
            gallery_id = db_photo.old_gallery_id
            file_name = db_photo.file_name
            self.alt_text = db_photo.alt_text
            self.caption = db_photo.caption
            res_gal = db_session.query(PhotoGallery).filter(PhotoGallery.old_id == gallery_id)
            if res_gal:
                db_gallery = res_gal.first()
                path = db_gallery.path_name
                relative_path = '/static/gallery/' + path + file_name
                self.url = relative_path
            else:
                raise ValueError(f'PhotoGalley {gallery_id} for photo {photo_id} does not exist in database.')
        else:
            raise ValueError(f'Photo {photo_id} does not exist in database.')

    def get_photo_location(self):
        return self.url
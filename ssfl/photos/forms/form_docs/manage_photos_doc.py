# Documentation fields for form upload_photos
docs = dict()

entry = dict()

# Fields used in all choices
docs['all'] = entry
x = """Select the function you want to perform. {{{Note that it may be useful to select a different function then select
the one you want to cause the system to remove unnecessary fields.  This is a bug I hope to fix.}}}
"""
entry['ph_all'] = [x]

x = """The name of the gallery or folder in which the photos reside.  If the photos reside in a folder within
a folder, the name would be the path name in the form: 'A/B/C'  (i.e., no leading or trailing slashes).
"""
entry['folder'] = [x]

x = """The earliest date of a photo that is to be included in the collection.  If left blank, it includes all
photos in the folder earlier than the latest_date (next).
"""
entry['early_date'] = [x]

x = """The latest date of a photo that is to be included in the collection.  The default is set to the current
date, so it can be left alone unless you want to preclude photos after some date earlier than today.
"""
entry['latest_date'] = [x]

x = """Name of the file (without an extension) for the downloaded metadata.  It will automatically have the 
extension of '.toml' and will appear in your downloads folder.
"""
entry['download_filename'] = [x]

x = """Click to select the filename of the metadata to be uploaded to replace the metadata of the specified photos. Note
that the photos being updated are identified by the id which is specified in the file on download.
"""
entry['upload_filename'] = [x]

x = """Name of the file in table wp_ngg_pictures (file name uploaded to WP) which is used to create
the URL for loading the photo.  Name should include '.jpg' extension.
"""
entry['wp_url'] = [x]

x = """ID of photo as given in Wordpress
"""
entry['wp_photo_id'] = [x]

x = """Slug for photo on Sunnyside-Times.org (new system)
"""
entry['sst_photo_slug'] = [x]






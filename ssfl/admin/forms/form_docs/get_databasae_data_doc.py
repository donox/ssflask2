# Documentation fields for form manage_page_data
docs = dict()

entry = dict()

# Fields used in all choices
docs['mpd_search'] = entry
x = """The name of the field to search.  This is the actual database name and is one of: page_name, page_title, 
page_author, page-date for pages or image_slug, filename, caption or alt_text for photos.
"""
entry['search_field'] = [x]

x = """This is the text string to be searched for.  It can be any portion (or all) of the selected field.  A '*' can 
be substituted for any sequence of characters.  The search is case insensitive
"""
entry['search_string'] = [x]

entry = dict()

docs['mpd_photo'] = entry
x = """Search string to search for photo folder.  Either the photo search string or the folder search string may
be absent.
"""
entry['folder_search'] = [x]




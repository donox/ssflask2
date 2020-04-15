# Documentation fields for form manage_photo
docs = dict()

entry = dict()

# Fields used in all choices
docs['edit'] = entry
x = """The ID is the actual database ID of the page to be uploaded or downloaded. Either the ID or the page_name below 
must be specified.
"""
entry['page_id'] = [x]

x = """The page_name (a.k.a. page_slug) of the page to be uploaded or downloaded.  It is an error if the page does
not exist in the database.
"""
entry['page_name'] = [x]

x = """For downloading the TOML file, this is the name (without an extension) to be given to the downloaded file.
"""
entry['file_name'] = [x]

x = """This indicates whether to upload a file or download it.  A check indicates that this is a download. Note that
this is somewhat redundant with which field above was selected.
"""
entry['direction'] = [x]

x = """When uploading a file, use this to select the file on your machine to be uploaded.
"""
entry['upload_file'] = [x]


entry['xx'] = ''

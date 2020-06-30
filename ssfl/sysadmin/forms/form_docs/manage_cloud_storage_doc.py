# Documentation fields for form manage_cloud_storage
# """Manage interaction with Google Drive."""
# """
#  Route: '/admin/cloud' => manage_cloud_storage
#  Template: cloud.jinja2
#  Form: manage_cloud_storage_form.py
#  Processor: manage_cloud_storage.py
# """

docs = dict()
# [('dpdb', 'Delete Page from Database'),
#                            ('dp', 'Download Page Directory'),
#                            ('df', 'Delete File'),
#                            ('show_layout', 'Make Layout Model')]
# function_to_execute = form.work_function.data
#     page_name = form.page_name.data
#     filename = form.filename.data
#     remove_text = form.remove_text.data

# Fields used in all choices
docs['all'] = entry = dict()
x = """Select the function to be performed.
"""
entry['work_function'] = [x]

# Fields requiring a Google Drive path
# docs['all'] = entry
x = """The path name to a directory on Google Drive.
"""
entry['directory_path'] = [x]


# Fields requiring a filename
# docs['all'] = entry = dict()
x = """Name of the file to be used (including extension).  This is used in both the source and destination
so no "renaming" of the file is done.
"""
entry['filename'] = [x]


# Fields requiring a local directory
# docs['all'] = entry = dict()
x = """The full path name of a local directory for storing files. The path name should end with a '/'.
"""
entry['save_directory'] = [x]

# Download only the database file
# docs['all'] = entry = dict()
x = """For existing Wordpress backup, download only the database file from the current backup.
"""
entry['db_only'] = [x]

# Install Backup
# docs['all'] = entry = dict()
x = """Install results of download of a Wordpress backup.  This includes updating the database 
and downloading and updating the photo gallery
"""
entry['install_backup'] = [x]


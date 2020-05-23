# Documentation fields for form xxx_form

# Route: '/sysadmin/manage_files' = > manage_files_commands
# Template: manage_files.jinja2
# Display: display_manage_files.jinja2
# Form: manage_files_form.py
# Processor: manage_files_commands.py

docs = dict()
#                           [('mf_disp', 'Display Files in Directory'),
#                            ('mf_upld', 'Upload File to Directory'),
#                            ('mf_xxx', 'Add a New User'),
#                            # ('mf_xxx', 'Modify an Existing User')]

# function_to_execute = form.work_function.data
# file_directory = form.file_directory.data
# upload_file = form.upload_file.data
# file_to_load = form.file_name.data


# Fields used in all choices
docs['all'] = entry = dict()
x = """Select the function to be performed.
"""
entry['work_function'] = [x]

# Fields requiring a group name
docs['mf_disp'] = entry
x = """Choose File Directory to be displayed
"""
entry['file_directory'] = [x]

# Field identifying file to upload
docs['mf_upld'] = entry
x = """This is the file name (with extension) under which the file will be stored.
"""
entry['upload_file'] = [x]

# Field selecting the file to be uploaded
docs['mf_upld'] = entry
x = """Select the file you want to upload
"""
entry['file_name'] = [x]







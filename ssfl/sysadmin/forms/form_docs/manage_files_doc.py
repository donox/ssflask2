# Documentation fields for form xxx_form

# Route: '/sysadmin/manage_caching' = > manage_caches
# Template: manage_caching.jinja2
# Form: manage_caching.py
# Processor: manage_caches.py

docs = dict()
# It's handy to pull functions and variables from Form for reference - can remove when done?
#                           [('gr_cg', 'Create a New Group'),
#                            ('gr_del', 'Delete an Existing Group'),

# function_to_execute = form.work_function.data
#     field_1 = form.field_1.data
#     field_2 = form.field_2.data

# Generally create an entry for each field.  This creates the dictionary that is used in the render_kw parameter
# to the form field.  Note the

# Fields used in all choices
docs['all'] = entry = dict()
x = """Select the function to be performed.
"""
entry['work_function'] = [x]

# Fields requiring a group name
docs['mf_disp'] = entry
x = """Choose File Directory to be displayed
"""
entry['field1_name'] = [x]

# Fields requiring a group owner
docs['abc_xxx'] = entry
x = """The name for ...
"""
entry['field3_name'] = [x]







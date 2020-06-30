
# Route: '/sysadmin/manage_system_configuration' => manage_system_config_commands
# Template: manage_system_configuration.jinja2
# Form: manage_system_configuration_form.py
# Processor: manage_system_config_commands.py

docs = dict()
# It's handy to pull functions and variables from Form for reference - can remove when done?
#                           [('gph_load', 'Create a New Group'),
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
docs['sys_main'] = entry
x = """Slug for template containing main page user configuration
"""
entry['template_name'] = [x]

# Fields requiring a group owner
x = """The slug for the template defining the new main page.
"""
entry['new_main_page'] = [x]







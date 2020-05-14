# Documentation fields for form miscellaneous_functions

docs = dict()
#                           [('gr_cg', 'Create a New Group'),
#                            ('gr_del', 'Delete an Existing Group'),
#                            ('gr_am', 'Add a Member to an Existing Group'),
#                            ('gr_rm', 'Remove a Member from an Existing Group'),
#                            ('gr_lg', 'List Existing Groups'),
#                            # ('gr_lm', 'List Members of an Existing Group')]
# function_to_execute = form.work_function.data
#     group_name = form.group_name.data
#     owner = form.group_owner.data
#     purpose = form.group_purpose.data
#     member_name = form.member_name.data

# Fields used in all choices
docs['all'] = entry = dict()
x = """Select the function to be performed.
"""
entry['work_function'] = [x]

# Fields requiring a group name
docs['gn'] = entry
x = """A unique name for the group. 
"""
entry['group_name'] = [x]

# Fields requiring a group owner
docs['go'] = entry
x = """The name for the owner of the group.  Note that the owner must be a registered user of the site.
"""
entry['owner'] = [x]

# Fields requiring a group purpose
docs['gp'] = entry
x = """Describe the purpose of the group.  Total entry may be up to 2,000 chars long.
"""
entry['group_purpose'] = [x]

# Fields requiring a member name
docs['mn'] = entry
x = """The name of a group member.  Must be a registered user of the site.
"""
entry['member_name'] = [x]






# Documentation fields for form manage_users
# Route: '/sysadmin/manage_users' = > manage_users
# Template: manage_users.jinja2
# Display: display_users.jinja2
# Form: manage_users_form.py
# Processor: manage_users.py

docs = dict()
    # ('usr_sr', 'Set Roles for a User'),
    # ('usr_del', 'Delete an Existing User'),
    # ('usr_add', 'Add a New User'),
    # ('usr_mod', 'Modify an Existing User')
#     function_to_execute
#     user_name
#     user_roles
#     user_password

# Fields used in all choices
docs['all'] = entry = dict()
x = """Select the function to be performed.
"""
entry['work_function'] = ['usr_sr']

# Fields requiring a user name
docs['usr_sr'] = entry
x = """The name of the user.  The first name will be considered to be all names prior to the last space.  The last
name will be the name after the last space.
"""
entry['user_name'] = [x]

# Fields associated with roles
"""Select the appropriate roles.  In the case of modifying an existing user, prior roles will be removed, so the 
full set of assigned roles should be
"""
docs['usr_sr'] = entry
x = """
"""
entry['user_roles'] = [x]

# Fields for setting/resetting a password
docs['usr_sr'] = entry
x = """Enter the password for a new user.  There are no restrictions, but the password for anyone who is not a resident
should be a strong one.
"""
entry['user_password'] = [x]

# Fields for user email
docs['usr_sr'] = entry
x = """Enter the user's email address.  Note that email addresses must be unique in the system, thus two users may not
have the same email account.
"""
entry['user_email'] = [x]







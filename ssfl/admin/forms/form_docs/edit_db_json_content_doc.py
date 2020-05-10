# Documentation fields for form DBJSONEditForm
docs = dict()


# Fields used in all choices
docs['all'] = entry = dict()
x = """Select the function to be performed.
"""
entry['work_function'] = [x]

# Fields requiring a page slug
docs['dp'] = entry
x = """The page_name (a.k.a. page_slug) of the page to be deleted or downloaded.  It is an error if the page does
not exist in the database.
"""
entry['page_name'] = [x]


docs['json'] = entry = dict()
x = """The ID is the actual database ID of the JSON descriptor to be operated on. If left
blank, then json_name below must be specified.
"""
entry['json_id'] = [x]

x = """The name or slug for this JSON descriptor. It identifies the same descriptor as
the JSON ID and only one needs to be specified.
"""
entry['json_name'] = [x]

docs['file'] = entry = dict()
x = """The name of the file to be written.
"""
entry['file_name'] = [x]

docs['proto'] = entry = dict()
x = """Save this JSON as a Prototype template for completion via other commands.
"""
entry['is_prototype'] = [x]

x = """Remove unnecessary whitespace from the JSON string representation.
"""
entry['compress'] = [x]

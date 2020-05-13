# Documentation fields for form miscellaneous_functions

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

# Fields requiring a page slug
docs['dp'] = entry
x = """The page_name (a.k.a. page_slug) of the page to be deleted or downloaded.  It is an error if the page does
not exist in the database.
"""
entry['page_name'] = [x]


# Fields requiring a filename
docs['df'] = entry = dict()
x = """Filename.  ***BROKEN - Not used except by Delete File which is not needed at this time.
"""
entry['filename'] = [x]


# Fields supporting layout generation
docs['show_layout'] = entry = dict()
x = """If selected, document text is removed and replaced with the tag name and attributes from the underlying
HTML element.  This is useful in making the layout clearer in many documents. 
"""
entry['remove_text'] = [x]


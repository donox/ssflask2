# Documentation fields for form make_page_elements

# Route: '/admin/make_page_elements' => make_page_elements
# Template: make_page_elements.jinja2
# Form: make_page_elements_form.py
# Processor: make_page_elements.py
#
# [('pl_cal', 'Make Calendar Element'),
#  ('dp', 'Download Page Directory'),
#  ('show_layout', 'Make Layout Model')]
#
# function_to_execute = form.work_function.data
#     page_name = form.page_name.data
#     filename = form.filename.data
#     remove_text = form.remove_text.data

docs = dict()
# Fields used in all choices
docs['all'] = entry = dict()
x = """Select the function to be performed.
"""
entry['work_function'] = [x]

x = """Enter the slug by which the descriptor will be identified.
"""
entry['slug'] = [x]

x = """Enter the slug or id for photo to be used for the story snippet.
"""
entry['snippet_photo'] = [x]

x = """Enter the slug in the database by which the story is known.
"""
entry['story_slug'] = [x]

x = """Enter the text to be included in the notice.
"""
entry['notice_text'] = [x]

x = """Select the type of notice
"""
entry['notice_type'] = [x]



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

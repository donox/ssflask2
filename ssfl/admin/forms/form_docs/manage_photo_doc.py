# Documentation fields for form manage_photo
docs = dict()

entry = dict()

# Fields used in all choices
docs['p_show'] = entry
x = """The ID is the actual database ID (if it exists) for this template, either this ID or the name (in the next field)
is required.  If this is a new template, use the name field.
"""
entry['slideshow_id'] = [x]

x = """The ID is the actual database ID (if it exists) for this template, either this ID or the name (in the next field)
is required.  If this is a new template, use the name field.
"""
entry['slideshow_name'] = [x]

x = """Title for the slideshow, also serves as title for the snippet.
"""
entry['slideshow_title'] = [x]

x = """This is text to go along with the slideshow.
"""
entry['slideshow_text'] = [x]

x = """This is a list of slides in the slideshow, specified in the order they are to scroll.  Each slide may be entered
with either its name(slug) or id.  Individual entries are separated by commas. 
"""
entry['slide_list'] = [x]

x = """This is a height of the slide frame in pixels.
"""
entry['slide_frame_height'] = [x]

x = """This is a width of the slide frame in pixels.
"""
entry['slide_frame_width'] = [x]

x = """This is the length of time in TENTHS of SECONDS a slide if visible before moving to the next.
"""
entry['slide_change'] = [x]

x = """This is the positioning of the slide frame in the parent container: LEFT, CENTER, RIGHT.
"""
entry['slide_alignment'] = [x]

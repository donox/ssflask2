
docs = dict()

entry = dict()

# Fields used in all choices
docs['all'] = entry
x = """The ID is the actual database ID (if it exists) for this template.
"""
entry['id'] = [x]

x = """The name is the actual unique database name (a.k.a slug) for this template. It is generally of the form 
foo-bar-baz... It is suggested that you develop a hierarchical naming convention for stories, etc. that are 
created to facilitate maintenance. 
"""
entry['name'] = [x]

# Fields used to create a new (or copy of) a template, generally used as a prototype for larger structures.
entry = dict()
docs['jcreate'] = entry
x = """This is the name of an existing template.  Often with a name beginning P_xxx (indicating that it is a prototype).
This template is completed to create a new entry stored under the name above.
"""
entry['template_content'] = [x]

x = """This specifies that the created template is itself a prototype which will be expanded to create new items for 
display.
"""
entry['prototype'] = [x]

x = """***I need to research why I did this and does it need to be user controllable.***
"""
entry['compress'] = [x]

# Fields associated with filling out the details of a story
entry = dict()
docs['jedit'] = entry
x = """This is the name of the template which will be filled out/expanded.  Once completed, it will be saved using the 
JSON Template named above.  In the case of editing/replacing an existing template, you may specify either the name or ID
 above
"""
entry['story_template'] = [x]

x = """The slug is the unique name associated with this result.  
"""
entry['story_slug'] = [x]

x = """This (optional) title is used as the Title on the article and overrides any title specified in the story itself.  
"""
entry['story_title'] = [x]

x = """This is the id for the picture that is shown when a story is displayed as a snippet.  It is not used (or overrides) 
any pictures specified in the story itself.
"""
entry['snippet_picture_id'] = [x]

x = """This (optional) author is used in the byline on the article and overrides any author specified in the story itself.
"""
entry['story_author'] = [x]


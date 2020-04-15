# Documentation fields for form manage_photo
docs = dict()

entry = dict()

# Fields used in all choices
docs['import'] = entry
x = """The file to be imported.  Click the Browse button and navigate to the desired Word file.  Be sure it
has the .docx extension
"""
entry['file_name'] = [x]

x = """The page_name (a.k.a. page_slug) of the page to be uploaded.  An error occurs if its existence is inconsistent
with the overwrite checkbox below. 
"""
entry['page_name'] = [x]

x = """The name of the author to be used for this document.  {{{We need to decide whether this takes precedence over
an author specified IN the document itself. }}}  Generally, this field is left blank.
"""
entry['author'] = [x]

x = """This indicates whether the page is replacing an existing page.  It is an error to specify overwrite if the file
does not exist and vice versa.
"""
entry['overwrite'] = [x]


entry['xx'] = ''

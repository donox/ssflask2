# Documentation fields for form manage_calendar
docs = dict()

entry = dict()

# Fields used in all choices
docs['all'] = entry
x = """Select the function to be performed.
"""
entry['work_function'] = [x]

# Fields used in choices involving csv (or json where both occur)
docs['c_csv'] = entry
x = """Press button to select the csv or json file to be imported. For csv, format should match that 
exported from Access database.  WARNING - function may take a while (10-20 sec) to run. """
entry['file_name'] = [x]

# Fields used in choices involving json
docs['c_json'] = entry
x = "asdf."
entry['xx'] = [x]

# Fields used in choices involving json
docs['c_pr'] = entry
x = "Select one or more audiences whose events are to be printed."
entry['audiences'] = [x]

x = "Select one or more categories whose events are to be printed."
entry['categories'] = [x]

x = "Set the earliest date and time for events to be printed in the format yyyy-mm-dd."
entry['start_datetime'] = [x]

x = "Set the latest date and time for events to be printed in the format yyyy-mm-dd."
entry['end_datetime'] = [x]

x = "Choose a filename for the file of printed events."
entry['save_file_name'] = [x]

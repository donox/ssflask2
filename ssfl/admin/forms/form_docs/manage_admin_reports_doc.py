# Documentation fields for form miscellaneous_functions

# Route: '/admin/make_report' = > manage_admin_reports
# Template: make_report.jinja2
# Form: manage_admin_reports_form.py
# Processor: manage_admin_reports.py

docs = dict()
# Fields used in all choices
docs['all'] = entry = dict()
x = """Select the function to be performed.
"""
entry['work_function'] = [x]

# Fields involved in defining the report
docs['report'] = entry
x = """Select the type of report this report represents.
"""
entry['entry_type'] = [x]

x = """Describe the issue you wish to report.
"""
entry['content'] = [x]


#

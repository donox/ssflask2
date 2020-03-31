import os

from db_mgt.page_tables import Page, PageManager
from utilities.miscellaneous import get_temp_file_name
import csv


def miscellaneous_functions(db_exec, form):
    """Place to build support before rebuilding interface."""
    """
     Route: '/admin/sst_miscellaneous' => miscellaneous_functions
     Template: miscellaneous_functions.jinja2
     Form: miscellaneous_functions_form.py
     Processor: miscellaneous_functions.py
    """
    function_to_execute = form.work_function.data
    page_name = form.page_name.data
    filename = form.filename.data

    try:
        page_mgr = db_exec.create_page_manager()
        if function_to_execute == 'dpdb':     # 'Delete Page from Database'
            page_mgr.delete_page(None, page_name)
            return function_to_execute, True
        elif function_to_execute == 'df':           # Delete File
            # TODO: Broken - must be in directory relative to static
            os.remove(filename)
            return function_to_execute, True
        elif function_to_execute == 'dp':           # Download a csv file of the Page Table
            file = get_temp_file_name('csv', 'csv')
            with open(file, 'w') as outfile:
                writer = csv.writer(outfile)
                key_list = ['id', 'page_name', 'page_date', 'page_title', 'page_author', 'page_parent']
                writer.writerow(key_list)
                for vals in page_mgr.generate_page_records(key_list):
                    writer.writerow(vals)
                outfile.close()
            return function_to_execute, file


        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['file process_page_masters - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

import os
from db_mgt.db_exec import DBExec
from db_mgt.page_tables import Page, PageManager
from utilities.miscellaneous import get_temp_file_name
import csv
from lxml import etree, html
import lxml
from flask import send_file
def miscellaneous_functions(db_exec: DBExec, form):
    """Place to build support before rebuilding interface."""
    """
     Route: '/admin/sst_miscellaneous' => miscellaneous_functions
     Template: miscellaneous_functions.jinja2
     Form: manage_photos_form.py
     Processor: upload_photos.py
    """
    function_to_execute = form.work_function.data
    page_name = form.page_name.data
    filename = form.filename.data
    remove_text = form.remove_text.data

    try:
        page_mgr = db_exec.create_page_manager()
        if function_to_execute == 'dpdb':     # 'Delete Page from Database'
            page_mgr.delete_page(None, page_name)
            return True
        elif function_to_execute == 'df':           # Delete File
            # TODO: Broken - must be in directory relative to static
            os.remove(filename)
            return True
        elif function_to_execute == 'dp':           # Download a csv file of the Page Table
            file = get_temp_file_name('csv', 'csv')
            with open(file, 'w') as outfile:
                writer = csv.writer(outfile)
                key_list = ['id', 'page_name', 'page_date', 'page_title', 'page_author', 'page_parent']
                writer.writerow(key_list)
                for vals in page_mgr.generate_page_records(key_list):
                    writer.writerow(vals)
                outfile.close()
                return send_file(file, mimetype="text/csv", as_attachment=True)
        elif function_to_execute == 'show_layout':
            try:
                page = page_mgr.get_page_if_exists(None, page_name)
                html_txt = page.page_content
                root = html.fromstring(html_txt)
                for el in root.iter():
                    tag = el.tag
                    attr = ' '.join([x for x in el.classes])
                    el.classes.add('devStyle')
                    if remove_text:
                        el.text = f'{tag} : {attr}'
                        el.tail = ''
                res = lxml.html.tostring(root)
                new_page = Page()
                new_page.page_title = page.page_title + '-layout'
                new_page.page_name = page.page_name + ' layout'
                new_page.page_author = page.page_author
                new_page.page_date = page.page_date
                new_page.page_status = 'publish'
                new_page.page_guid = 'TBD'
                new_page.page_content = res
                page_mgr.add_page_to_database(new_page, True)
                return True
                # lxml.html.open_in_browser(root)
            except Exception as e:
                form.errors['work_function'] = [f'Unknown exception in miscellaneous_functions: {e.args}']
                return False
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['miscellaneous_functions - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

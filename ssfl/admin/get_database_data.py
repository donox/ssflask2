import os

from db_mgt.page_tables import Page, PageManager
from utilities.miscellaneous import get_temp_file_name, extract_fields_to_dict, make_re_from_string
import csv
from flask import render_template
from db_mgt.db_exec import DBExec


def db_manage_pages(db_exec: DBExec, form):
    """Place to build support before rebuilding interface."""
    """
     Route: '/admin/manage_page_data' => manage_page_data
     Template: manage_page_data.jinja2
     Display:  display_page_data.jinja2
     Form: manage_page_data_form.py
     Processor: manage_page_data.py
    """
    function_to_execute = form.work_function.data
    search_string = form.search_string.data
    search_field = form.search_field.data
    folder_search = form.folder_search.data
    nbr_pages = 10
    page_fields = ['id', 'page_title', 'page_name', 'page_author', 'page_date']
    photo_fields = ['id', 'slug', 'file_name', 'folder_name', 'caption', 'image_date']
    result_template = 'admin/display_page_data.jinja2'

    try:
        page_mgr = db_exec.create_page_manager()
        photo_mgr = db_exec.create_sst_photo_manager()
        if function_to_execute == 'mpd_recent':     # 'Display Most Recent Pages'
            page_list = page_mgr.get_recent_pages(nbr_pages)
            res = []
            for page in page_list:
                res.append(extract_fields_to_dict(page, page_fields))
                context = dict()
                context['function'] = 'mpd_recent'
                context['fields'] = page_fields
                context['values'] = res
            result = render_template(result_template, **context)
            return result

        elif function_to_execute == 'mpd_search':           # Display Recent Pages by Author
            page_list = page_mgr.get_records_by_field_search(search_field, search_string, nbr_pages)
            res = []
            for page in page_list:
                res.append(extract_fields_to_dict(page, page_fields))
                context = dict()
                context['function'] = 'mpd_search'
                context['search_field'] = search_field
                context['search_string'] = search_string
                context['fields'] = page_fields
                context['values'] = res
            result = render_template(result_template, **context)
            return result

        elif function_to_execute == 'mpd_photo':           # Display Recent Pages by Author
            photo_list = photo_mgr.get_records_by_field_search(search_field, folder_search, search_string, nbr_pages)
            res = []
            for photo in photo_list:
                res.append(extract_fields_to_dict(photo, photo_fields))
                context = dict()
                context['function'] = 'mpd_photo'
                context['search_field'] = search_field
                context['search_string'] = search_string
                context['folder_search'] = folder_search
                context['fields'] = photo_fields
                context['values'] = res
            result = render_template(result_template, **context)
            return result

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

import os
from flask import send_file
from db_mgt.page_tables import Page, PageManager
from utilities.miscellaneous import get_temp_file_name, extract_fields_to_dict, make_re_from_string
import csv
from flask import render_template
from db_mgt.db_exec import DBExec
from ssfl.main.story import Story
from config import Config


def db_manage_pages(db_exec: DBExec, form):
    """Place to build support before rebuilding interface."""
    """
     Route: '/admin/manage_page_data' => manage_page_data
     Template: db_get_database_data.jinja2
     Display:  db_display_database_data.jinja2
     Form: get_database_data_form.py
     Processor: db_get_database_data.py
    """
    function_to_execute = form.work_function.data
    search_string = form.search_string.data
    search_field = form.search_field.data
    search_object = form.search_object.data
    folder_search = form.folder_search.data
    verify_element = form.verify_element.data
    nbr_items_to_display = 200
    page_fields = ['view', 'delete', 'id', 'page_title', 'page_name', 'page_author', 'page_date']
    photo_fields = ['delete', 'id', 'slug', 'file_name', 'folder_name', 'caption', 'image_date']
    result_template = 'admin/db_display_database_data.jinja2'

    try:
        page_mgr = db_exec.create_page_manager()
        photo_mgr = db_exec.create_sst_photo_manager()
        if function_to_execute == 'mpd_page':  # 'Display Most Recent Pages'
            page_list = page_mgr.get_recent_pages(nbr_items_to_display)
            res = []
            for page in page_list:
                field_values = extract_fields_to_dict(page, page_fields)
                del_button = dict()
                del_button['action'] = '/admin/delete_row'
                del_button['table'] = 'page'
                del_button['row_id'] = page.id
                del_button['function'] = 'Delete'
                del_button['method'] = 'POST'
                field_values['del_button'] = del_button
                view_button = dict()
                view_button['action'] = f'/main/page/{page.id}'
                view_button['table'] = 'page'
                view_button['row_id'] = page.id
                view_button['function'] = 'View'
                view_button['method'] = 'GET'
                field_values['view_button'] = view_button
                res.append(field_values)
            context = dict()
            context['function'] = 'mpd_recent'
            context['fields'] = page_fields
            context['values'] = res
            context['add_data_table'] = True  # cause layout to include CDN for DataTables
            result = render_template(result_template, **context)
            return result

        elif function_to_execute == 'mpd_search' and search_object == 'page':  # Display Recent Pages search by field name, string
            page_list = page_mgr.get_records_by_field_search(search_field, search_string, nbr_items_to_display)
            res = []
            for page in page_list:
                field_values = extract_fields_to_dict(page, page_fields)
                del_button = dict()
                del_button['action'] = '/admin/delete_row'
                del_button['table'] = 'page'
                del_button['row_id'] = page.id
                del_button['function'] = 'Delete'
                del_button['method'] = 'POST'
                field_values['del_button'] = del_button
                view_button = dict()
                view_button['action'] = f'/main/page/{page.id}'
                view_button['table'] = 'page'
                view_button['row_id'] = page.id
                view_button['function'] = 'View'
                view_button['method'] = 'GET'
                field_values['view_button'] = view_button
                res.append(field_values)
            context = dict()
            context['function'] = 'mpd_search'
            context['search_field'] = search_field
            context['search_string'] = search_string
            context['fields'] = page_fields
            context['values'] = res
            context['add_data_table'] = True  # cause layout to include CDN for DataTables
            result = render_template(result_template, **context)
            return result

        elif function_to_execute == 'mpd_photo':  # Display Most Recent Photos
            photo_list = photo_mgr.get_recent_photos(nbr_items_to_display)
            context = _build_photo_list(photo_list, search_field, search_string, folder_search, photo_fields)
            result = render_template(result_template, **context)
            return result

        elif function_to_execute == 'mpd_search' and search_object == 'photo':  # Find Photos by Field, Search String
            if not (search_string or search_field):
                form.errors['Missing search criteria'] = [
                    'Must supply both a search field and search string']
                return False
            photo_list = photo_mgr.get_records_by_field_search(search_field, None, search_string, nbr_items_to_display)
            context = _build_photo_list(photo_list, search_field, search_string, folder_search, photo_fields)
            result = render_template(result_template, **context)
            return result

        elif function_to_execute == 'mpd_folder':
            if not folder_search:
                form.errors['Missing Folder Name'] = ['No Folder Name Given']
                return False
            elif not os.path.isdir(Config.USER_DIRECTORY_IMAGES + folder_search):
                form.errors['Invalid Folder Name'] = [
                    f'Folder {folder_search} not recognized.  Improper capitalization?']
                return False
            photo_list = photo_mgr.get_photos_in_folder(folder_search)
            context = _build_photo_list(photo_list, search_field, search_string, folder_search, photo_fields)
            result = render_template(result_template, **context)
            return result

        elif function_to_execute == 'mpd_page_csv':  # Download a csv file of the Page Table
            file = get_temp_file_name('csv', 'csv')
            with open(file, 'w') as outfile:
                writer = csv.writer(outfile)
                key_list = ['id', 'page_name', 'page_date', 'page_title', 'page_author', 'verify']
                writer.writerow(key_list)
                width = 12
                for vals in page_mgr.generate_page_records(key_list[0:-1]):
                    if verify_element:
                        try:
                            story = Story(db_exec, width)
                            story.create_story_from_db(page_id=vals[0], page_name=None)
                        except Exception as e:
                            vals.append('FAIL')
                    writer.writerow(vals)
                outfile.close()
            return send_file(file, mimetype='application/octet', as_attachment=True,
                             attachment_filename='Page_Listing.csv')

        elif function_to_execute == 'mpd_photo_csv':  # Download a csv file of the Page Table
            file = get_temp_file_name('csv', 'csv')
            with open(file, 'w') as outfile:
                writer = csv.writer(outfile)
                key_list = ['id', 'slug', 'file_name', 'folder_name', 'caption', 'image_date', 'verify']
                writer.writerow(key_list)
                for vals in photo_mgr.generate_photo_records(key_list[0:-1]):
                    if verify_element:
                        photo_slug = vals[1]
                        res = photo_mgr.get_photo_by_slug_if_exists(photo_slug)
                        if not res:
                            vals.append('FAIL')
                    writer.writerow(vals)
                outfile.close()
            return send_file(file, mimetype='application/octet', as_attachment=True,
                             attachment_filename='Photo_Listing.csv')


        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['file process_page_masters - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False


def _build_photo_list(photos, search_field, search_string, folder_search, photo_fields):
    res = []
    for photo in photos:
        res.append(extract_fields_to_dict(photo, photo_fields))
    context = dict()
    context['function'] = 'mpd_photo'
    context['search_field'] = search_field
    context['search_string'] = search_string
    context['folder_search'] = folder_search
    context['fields'] = photo_fields
    context['values'] = res
    context['add_data_table'] = True  # cause layout to include CDN for DataTables
    return context

import os
from db_mgt.db_exec import DBExec
from db_mgt.page_tables import Page, PageManager
from utilities.miscellaneous import get_temp_file_name
from ssfl.main.cell_builder import CellBuilder
from ssfl.main.story import Story
from db_mgt.json_storage_manager import JSONStorageManager

def make_page_cells(db_exec: DBExec, form):
    """Create descriptors for page cells."""
    """
     Route: '/admin/make_page_cells' => make_page_cells
     Template: make_page_cells.jinja2
     Form: make_page_cells_form.py
     Processor: make_page_cells.py
    """
    function_to_execute = form.work_function.data
    slug = form.slug.data
    story_slug = form.story_slug.data
    notice_type = form.notice_type.data
    notice_text = form.notice_text.data

    try:
        json_mgr = db_exec.create_json_manager()

        if function_to_execute == 'pl_cal':     # 'Make Calendar Snippet Cell'
            cell_builder = CellBuilder(db_exec, 'P_CALENDAR_SNIPPET')
            exists = json_mgr.check_slug_existence(slug)
            cell_builder.manage_calendar_cell(slug, update=exists, event_count=50)
            return True
        elif function_to_execute == 'pl_not':           # Create Notice
            cell_builder = CellBuilder(db_exec, 'P_SIGN_SNIPPET')
            exists = json_mgr.check_slug_existence(slug)
            cell_builder.manage_sign_cell(slug=slug, update=exists, sign_type=notice_type, sign_text=notice_text)
            return True
        elif function_to_execute == 'pl_sty':           # Create Full Story
            cell_builder = CellBuilder(db_exec, 'P_STORY')
            pg_mgr = db_exec.create_page_manager()
            exists = pg_mgr.get_page_if_exists(None, story_slug)
            if not exists:
                db_exec.add_error_to_form('Non-existent Story', f'Story: {story_slug} does not exist')
                return False
            story = Story(db_exec, None)
            # We create the story in cell builder to allow for the possibility that it is already in the cell cache
            # and we can avoid creating it again.
            cell_builder.manage_story_cell(slug=slug, update=exists, story=story, story_slug=story_slug)
            return True

    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['miscellaneous_functions - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

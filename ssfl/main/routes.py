from flask import Blueprint, render_template, request, send_from_directory
from flask_user import roles_required
from cache import cache
import mimetypes

from db_mgt.index_page_tables import IndexPage
from db_mgt.setup import get_engine, create_session, close_session
from db_mgt.db_exec import DBExec
from desc_mgt.build_descriptors import Descriptors
from ssfl.admin.manage_index_pages import build_index_page_context
from ssfl.main.build_page import BuildPage
from ssfl.main.multi_story_page import MultiStoryPage
from ssfl.main.views.calendar_view import RandomCalendarAPI
from utilities.toml_support import dict_to_toml_file
from config import Config
from ssfl.admin.routes import build_route
from .forms.work_with_groups_form import WorkWithGroupsForm
from .work_with_groups import work_with_groups_processor

# Set up a Blueprint
main_bp = Blueprint('main', __name__,
                    template_folder='templates/main',
                    static_folder='static')

cal_view = RandomCalendarAPI.as_view('cal_api')
main_bp.add_url_rule('/cal/', defaults={'count': 6},
                     view_func=cal_view, methods=['GET'])


def log_request(file, tag, context):
    context['tag'] = tag
    dict_to_toml_file(context, Config.TEMP_FILE_LOC + 'cmd_logs/' + file)


@main_bp.route('/main/download_file', methods=['GET'])
@roles_required('User')
def sst_download_page():
    """Download a page using send_file. """
    db_exec = DBExec()
    try:
        directory = request.args['directory']
        filename = request.args['filename']
        context = {'APP_ROOT': request.base_url,
                   'directory': directory,
                   'filename': filename}
        # log_request(f'Download page: {filename} from  {directory}', 'download', context)
        return render_template('admin/download_file.jinja2', **context)
    finally:
        db_exec.terminate()


@main_bp.route('/main/fullcalendar', methods=['GET'])
@roles_required('User')
def sst_main_calendar():
    context = dict()
    context['APP_ROOT'] = request.base_url
    log_request('fullcalendar', 'fullcalendar', context)
    return render_template('main/calendar.jinja2', **context)


@main_bp.route('/', methods=['GET'])
@roles_required('User')
# @cache.cached()
def sst_main():
    """Main page route."""
    """
     Route: '/main/main' => multi_story_page
     Template: main.jinja2
     Form: 
     Processor: multi_story_page.py
    """
    db_exec = DBExec()
    try:
        json_mgr = db_exec.create_json_manager()
        usr_config = json_mgr.get_json_from_name('user_config')
        msp = MultiStoryPage(db_exec)
        context = msp.make_multi_element_page_context(descriptor_name=usr_config['main2_page'])
        context['APP_ROOT'] = request.base_url
        log_request('main', 'main', context)
        res = render_template('main/main.jinja2', **context)
        return res
    finally:
        db_exec.terminate()


@main_bp.route('/main/page/<string:page_ident>', methods=['GET'])
@roles_required('User')
# @cache.cached()
def sst_get_specific_page(page_ident):
    """Get specific page by id or name."""
    db_exec = DBExec()
    try:
        new_page = MultiStoryPage(db_exec)
        new_res = new_page.make_single_page_context(page_ident)
        context = new_res['PAGE']['rows'][0]['ROW']['columns'][0]['cells'][0]
        context['story'] = context['element']
        context['story']['body'] = context['story']['content']
        context['APP_ROOT'] = request.base_url
        log_request('page_ident', 'page_ident: ' + str(page_ident), context)
        res = render_template('main/specific_page.jinja2', **context)
        return res
    finally:
        db_exec.terminate()


@main_bp.route('/menu/<string:page>', methods=['GET'])
@roles_required('User')
# @cache.cached()
def sst_get_menu_page(page):
    """Load index page by name."""
    """
     Route: '/menu/<string:page>' => build_page
     Template: specific_page.jinja2
     Form: 
     Processor: build_page.py
    """
    # This route used in nav template.
    db_exec = DBExec()
    try:
        bp = BuildPage(db_exec, None)
        context = bp.display_menu_page(page)
        context['APP_ROOT'] = request.url_root
        return render_template('main/specific_page.jinja2', **context)
    finally:
        db_exec.terminate()


@main_bp.route('/main/quick-links', methods=['GET'])
@roles_required('User')
# @cache.cached()
def sst_get_quick_links():
    """Load Quick Links page."""
    """
     Route: '/menu/<string:page>' => build_page
     Template: specific_page.jinja2
     Form: 
     Processor: build_page.py
    """
    # This route used in nav template.
    db_exec = DBExec()
    try:
        json_mgr = db_exec.create_json_manager()
        quick_links = json_mgr.get_json_from_name('quick-links')
        context = {'page': quick_links,
                   'APP_ROOT': request.url_root}
        res = render_template('main/quick_links.jinja2', **context)
        return res
    finally:
        db_exec.terminate()


@main_bp.route('/index/<string:page>', methods=['GET'])
@roles_required('User')
def sst_get_index_page(page):
    """
     Route: '/index/<string:page>' => manage_index_pages
     Template: manage_index_pages.jinja2
     Form:
     Processor: index_page_layout.py
    """
    db_session = create_session(get_engine())
    try:
        index_page = db_session.query(IndexPage).filter(IndexPage.page_name == page).first()
    except Exception as e:
        foo = 3
        # Render an error page
    context = build_index_page_context(db_session, index_page)
    context['APP_ROOT'] = request.url_root
    close_session(db_session)
    return render_template('main/index_page_layout.jinja2', **context)


@main_bp.route('/main/work_with_groups', methods=['GET', 'POST'])
@roles_required('User')
def work_with_groups():
    """Manage groups """
    """
     Route: '/main/work_with_groups' => work_with_groups_processor
     Template: work_with_groups.jinja2
     Form: work_with_groups_form.py
     Processor: work_with_groups_processor.py
    """
    return build_route('main/work_with_groups.jinja2', WorkWithGroupsForm(), work_with_groups_processor,
                       '/main/work_with_groups')()

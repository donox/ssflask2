from flask import Blueprint, render_template, request
from flask_login import login_required

from db_mgt.index_page_tables import IndexPage
from db_mgt.setup import get_engine, create_session, close_session
from db_mgt.db_exec import DBExec
from ssfl.admin.manage_index_pages import build_index_page_context
from ssfl.main.build_page import BuildPage
from ssfl.main.multi_story_page import MultiStoryPage
from ssfl.main.views.calendar_view import RandomCalendarAPI
from utilities.toml_support import dict_to_toml_file
from config import Config

# Set up a Blueprint
main_bp = Blueprint('main', __name__,
                    template_folder='templates/main',
                    static_folder='static')

cal_view = RandomCalendarAPI.as_view('cal_api')
main_bp.add_url_rule('/cal/', defaults={'count': 6},
                     view_func=cal_view, methods=['GET'])


def log_request(file, tag, context):
    context['tag'] = tag
    dict_to_toml_file(context, Config.TEMP_FILE_LOC +'cmd_logs/' + file)


@main_bp.route('/main/fullcalendar', methods=['GET'])
@login_required
def sst_main_calendar():
    context = dict()
    context['APP_ROOT'] = request.base_url
    log_request('fullcalendar', 'fullcalendar', context)
    foo = render_template('main/calendar.jinja2', **context)
    return foo


@main_bp.route('/main', methods=['GET'])
@login_required
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
        msp.load_descriptor_from_database(usr_config['main_page'])
        context = msp.make_multi_element_page_context()
        context['APP_ROOT'] = request.base_url
        log_request('main', 'main', context)
        res = render_template('main/main.jinja2', **context)
        return res
    finally:
        db_exec.terminate()


@main_bp.route('/main/page/<string:page_ident>', methods=['GET'])
@login_required
def sst_get_specific_test_page(page_ident):
    """Get specific page by id or name."""
    db_exec = DBExec()
    try:
        new_page = MultiStoryPage(db_exec)
        new_res = new_page.make_single_page_context(page_ident)    # TODO:  ALLOW PAGE ID
        context = new_res['PAGE']['rows'][0]['ROW']['columns'][0]['cells'][0]
        context['story'] = context['element']
        context['story']['body'] = context['story']['content']
        context['APP_ROOT'] = request.base_url
        log_request('page_ident', 'page_ident: ' + str(page_ident), context)
        return render_template('main/specific_page.jinja2', **context)
    finally:
        db_exec.terminate()


@main_bp.route('/menu/<string:page>', methods=['GET'])
@login_required
def sst_get_menu_page(page):
    """Load index page by name."""
    """
     Route: '/menu/<string:page>' => build_page
     Template: specific_page.jinja2
     Form: 
     Processor: build_page.py
    """
    db_exec = DBExec()
    try:
        bp = BuildPage(db_exec, None)
        context = bp.display_menu_page(page)
        context['APP_ROOT'] = request.url_root
        return render_template('main/specific_page.jinja2', **context)
    finally:
        db_exec.terminate()


@main_bp.route('/index/<string:page>', methods=['GET'])
@login_required
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

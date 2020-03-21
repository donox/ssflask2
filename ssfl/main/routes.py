from flask import Blueprint, render_template, request
from flask_login import login_required

from db_mgt.index_page_tables import IndexPage
from db_mgt.setup import get_engine, create_session, close_session
from ssfl.admin.manage_index_pages import build_index_page_context
from ssfl.main.build_page import BuildPage
from ssfl.main.multi_story_page import MultiStoryPage
from ssfl.main.views.calendar_view import RandomCalendarAPI

# Set up a Blueprint
main_bp = Blueprint('main', __name__,
                    template_folder='templates/main',
                    static_folder='static')

cal_view = RandomCalendarAPI.as_view('cal_api')
main_bp.add_url_rule('/cal/', defaults={'count': 10},
                     view_func=cal_view, methods=['GET'])


@main_bp.route('/main/fullcalendar', methods=['GET'])
@login_required
def sst_main_calendar():
    context = dict()
    context['APP_ROOT'] = request.base_url
    return render_template('main/calendar.jinja2', **context)

@main_bp.route('/main', methods=['GET'])
@login_required
def sst_main():
    """Main page route."""

    db_session = create_session(get_engine())
    msp = MultiStoryPage(db_session)
    msp.load_descriptor_from_database('fpage')
    context = msp.make_multi_element_page_context()
    context['APP_ROOT'] = request.base_url
    close_session(db_session)
    res = render_template('main/main.jinja2', **context)
    return res


@main_bp.route('/main/page/<string:page_ident>', methods=['GET'])
@login_required
def sst_get_specific_page(page_ident):
    """Get specific page by id."""
    db_session = create_session(get_engine())
    bp = BuildPage(db_session, page_ident)
    context = bp.display_page()
    context['APP_ROOT'] = request.base_url
    close_session(db_session)
    return render_template('main/specific_page.jinja2', **context)

@main_bp.route('/main/testpage/<string:page_ident>', methods=['GET'])
@login_required
def sst_get_specific_test_page(page_ident):
    """Get specific page by id or name."""
    db_session = create_session(get_engine())
    new_page = MultiStoryPage(db_session)
    new_res = new_page.make_single_page_context(page_ident)    # TODO:  ALLOW PAGE ID
    context = new_res['rows'][0]['columns'][0]['cells'][0]
    context['story'] = context['STORY']
    context['story']['body'] = context['story']['content']
    context['APP_ROOT'] = request.base_url
    close_session(db_session)
    return render_template('main/specific_page.jinja2', **context)


@main_bp.route('/main/single/<string:page_ident>', methods=['GET'])
@login_required
def sst_get_single_page(page_ident):
    """TEMPORARY - step to using  common page rendering."""
    db_session = create_session(get_engine())
    msp = MultiStoryPage(db_session)
    msp.make_descriptor_from_story_id(page_ident, 12)
    context = msp.make_multi_element_page_context()
    context['APP_ROOT'] = request.base_url
    close_session(db_session)
    return render_template('main/main.jinja2', **context)


@main_bp.route('/menu/<string:page>', methods=['GET'])
@login_required
def sst_get_menu_page(page):
    """Load index page by name."""
    db_session = create_session(get_engine())
    bp = BuildPage(db_session, None)
    context = bp.display_menu_page(page)
    context['APP_ROOT'] = request.url_root
    close_session(db_session)
    return render_template('main/specific_page.jinja2', **context)


@main_bp.route('/index/<string:page>', methods=['GET'])
@login_required
def sst_get_index_page(page):
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

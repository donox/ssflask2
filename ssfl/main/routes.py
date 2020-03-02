from flask import Flask, Blueprint, render_template, request
from flask_login import login_required
from db_mgt.setup import get_engine, create_session, close_session
from ssfl.main.front_page import BuildFrontPage
from ssfl.main.multi_story_page import MultiStoryPage
from ssfl.main.build_page import BuildPage
from ssfl.main.views.calendar_view import RandomCalendarAPI
from db_mgt.index_page_tables import IndexPage, IndexPageItem
from ssfl.admin.manage_index_pages import build_index_page_context



# Set up a Blueprint
main_bp = Blueprint('main', __name__,
                    template_folder='templates/main',
                    static_folder='static')

cal_view = RandomCalendarAPI.as_view('cal_api')
main_bp.add_url_rule('/cal/', defaults={'count': 10},
                 view_func=cal_view, methods=['GET'])


# @main_bp.route('/oldmain/<string:page_name>/')
# def render_static(page_name):
#     return render_template('main/%s.html' % page_name)

@main_bp.route('/main', methods=['GET'])
@login_required
def sst_main():
    """Main page route."""
    db_session = create_session(get_engine())
    msp = MultiStoryPage(db_session)
    msp.load_descriptor_from_database('front-page')
    context = msp.make_front_page_context()
    context['APP_ROOT'] = request.base_url
    close_session(db_session)
    return render_template('main/main.html', **context)


# @main_bp.route('/XXmain', methods=['GET'])
# @login_required
# def sst_main():
#     """Main page route."""
#     db_session = create_session(get_engine())
#     fp = BuildFrontPage(db_session)
#     context = fp.make_front_page_context()
#     context['APP_ROOT'] = request.base_url
#     close_session(db_session)
#     return render_template('main/main.html', **context)


@main_bp.route('/main/page/<string:page_ident>', methods=['GET'])
@login_required
def sst_get_specific_page(page_ident):
    db_session = create_session(get_engine())
    bp = BuildPage(db_session, page_ident)
    context = bp.display_page()
    context['APP_ROOT'] = request.base_url
    close_session(db_session)
    return render_template('main/specific_page.html', **context)


@main_bp.route('/hello')                        # DELETE WHEN THINGS ARE GENERALLY WORKING
def hello_world():
    context = dict()
    return render_template('main/index.html', **context)


@main_bp.route('/menu/<string:page>', methods=['GET'])
@login_required
def sst_get_menu_page(page):
    db_session = create_session(get_engine())
    bp = BuildPage(db_session, None)
    context = bp.display_menu_page(page)
    context['APP_ROOT'] = request.url_root
    close_session(db_session)
    return render_template('main/specific_page.html', **context)


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
    return render_template('main/index_page_layout.html', **context)

# @main_bp.route('/main/multi', methods=['GET'])
# @login_required
# def sst_multi():
#     """Multi row/col collection of snippets route."""
#     db_session = create_session(get_engine())
#     fp = BuildFrontPage(db_session)
#     context = fp.make_front_page_context()
#     context['APP_ROOT'] = request.base_url
#     close_session(db_session)
#     return render_template('main/multi_row_col.html', **context)
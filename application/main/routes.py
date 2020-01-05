from flask import Flask, Blueprint, render_template, request
from flask_login import login_required
from db_mgt.setup import get_engine, create_session, close_session
from application.main.front_page import BuildFrontPage
from application.main.build_page import BuildPage



# Set up a Blueprint
main_bp = Blueprint('main', __name__,
                    template_folder='templates/main',
                    static_folder='static')


@main_bp.route('/main', methods=['GET'])
@login_required
def sst_main():
    """Main page route."""
    db_session = create_session(get_engine())
    fp = BuildFrontPage(db_session)
    context = fp.make_front_page_context()
    context['APP_ROOT'] = request.base_url
    close_session(db_session)
    return render_template('main/main.html', **context)


@main_bp.route('/main/page/<int:page_id>', methods=['GET'])
@login_required
def sst_get_specific_page(page_id):
    db_session = create_session(get_engine())
    bp = BuildPage(db_session, page_id)
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
    menu_pages = ['activities']
    bp = BuildPage(db_session, None)
    context = bp.display_menu_page(page)
    context['APP_ROOT'] = request.url_root
    close_session(db_session)
    return render_template('main/specific_page.html', **context)

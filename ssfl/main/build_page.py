from ssfl.main.story import Story
from db_mgt.page_tables import Page


class BuildPage(object):
    """
     Route: '/main/page/<string:page_ident>' => build_page
     Template: specific_page.jinja2
     Form:
     Processor: build_page.py
    """
    def __init__(self, db_exec, page_ident):
        self.page_id = None
        self.page_name = None
        try:
            self.page_id = int(page_ident)
        except:
            self.page_name = page_ident
        self.context = dict()
        self.db_exec = db_exec
        self.page_mgr = db_exec.create_page_manager()

    def display_page(self):
        story_to_display = Story(self.db_exec, 12)      # 12 is full width
        story_to_display.create_story_from_db(page_id=self.page_id, page_name=self.page_name)
        self.context['story'] = story_to_display.story
        return self.context

    def display_menu_page(self, menu_slug):
        # menu_page = self.session.query(Page).filter(Page.page_name == menu_slug).first()
        menu_page = self.page_mgr.fetch_page(None, menu_slug)
        story_to_display = Story(self.db_exec, 12)
        story_to_display.create_story_from_db(menu_page.id)
        self.context['story'] = story_to_display.story
        self.context['tab_title'] = story_to_display.story['tab_title']
        return self.context

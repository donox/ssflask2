from ssfl.main.story import Story
from db_mgt.page_tables import Page


class BuildPage(object):
    def __init__(self, session, page_id):
        self.page_id = page_id
        self.context = dict()
        self.session = session

    def display_page(self):
        story_to_display = Story(self.session, 12)      # 12 is full width
        story_to_display.create_story_from_db(self.page_id)
        self.context['story'] = story_to_display.story
        return self.context

    def display_menu_page(self, menu_slug):
        menu_page = self.session.query(Page).filter(Page.page_name == menu_slug).first()
        story_to_display = Story(self.session, 12)
        story_to_display.create_story_from_db(menu_page.id)
        self.context['story'] = story_to_display.story
        self.context['tab_title'] = story_to_display.story['tab_title']
        return self.context

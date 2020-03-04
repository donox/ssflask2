import csv
from ssfl.main.story import Story
from db_mgt.photo_tables import Photo
from config import Config
from .views.calendar_view import RandomCalendarAPI, get_random_events
from flask import render_template
from .calendar_snippet import Calendar


class BuildFrontPage(object):
    def __init__(self, db_session):
        self.session = db_session
        self.descriptor = None
        self.context = dict()
        with open(Config.USER_DEFINITION_FILES + 'front_page_layout.csv', 'r') as fl:
            layout = csv.reader(fl)
            self._set_descriptor(layout)

    def _set_descriptor(self, layout):
        """Read descriptor for front page and build layout.

        Args:
            layout: csv file:   Description of content of front page.

        Returns:
            None
        """
        try:
            raise ValueError("THIS FILE IS NOT SUPPOSED TO BE NEEDED")
            self.descriptor = dict()
            for row in layout:
                cmd = row[0].lower()
                if cmd == 'end':
                    return
                elif cmd == 'roworg':
                    rownum = int(row[1])
                    widths = [int(x) for x in row[2].split(',')]
                    new_row = dict()
                    self.descriptor[rownum] = new_row
                    new_row['shape'] = widths
                    for i, width in enumerate(widths):
                        new_cell = dict()
                        new_row[i+1] = new_cell     # Note: rows and columns are 1 based
                        new_cell['width'] = width
                elif cmd == 'story':
                    # TODO: allow for multiple stories in same cell
                    # Select row and column in row - this is the dictionary for a specific cell
                    photo = self.descriptor[int(row[1])][int(row[2])]
                    photo['cell_type'] = 'story'
                    photo['story'] = row[3]
                    pic = None
                    pic_shape = None
                    pic_align = None
                    pic_caption = ''
                    if len(row) > 4:
                        pic = int(row[4])
                    photo['photo_id'] = pic
                    photo['photo_url'] = self._get_photo_url(pic)
                    if len(row) > 5:
                        pic_shape = [int(x) for x in row[5].split(',')]
                    photo['photo_shape'] = pic_shape
                    if len(row) > 6:
                        pic_align = row[6]
                    photo['photo_align'] = pic_align
                    if len(row) > 7:
                        pic_caption = row[7]
                    photo['photo_caption'] = pic_caption
                elif cmd == 'calendar':
                    calendar = self.descriptor[int(row[1])][int(row[2])]
                    calendar['cell_type'] = 'calendar'
                    count = 10
                    events = get_random_events(self.session, count)
                    context = {'events': []}
                    for event in events:
                        this_event = {}
                        this_event['title'] = event.event_name
                        # this_event['venue'] = event.event_location        # this is foreign key
                        this_event['description'] = event.event_description
                        context['events'].append(this_event)
                    calendar['events'] = context
                    # res = render_template('main/calendar_plugin.jinja2', **context)
                else:
                    raise ValueError('Unrecognized Command: {}'.format(cmd))
            raise ValueError('Fell off end of loop')
        except Exception as e:
            print('Exception in _set_descriptor:{}'.format(e.args))
            raise e

    def _get_photo_url(self, photo_id):
        url = Photo.get_photo_url(self.session, photo_id)
        return url

    def make_front_page_context(self):
        row_list = self.descriptor.keys()
        all_snips = []
        for row in sorted([x for x in row_list]):
            row_snip = []
            content = self.descriptor[row]
            for col, width in enumerate(content['shape']):
                # TODO: deal with multiple stories in same cell
                if content[col+1]['cell_type'] == 'story':
                    page_name = content[col+1]['story']
                    story = self.create_story(page_name, width)
                    story.add_to_context('photo_url', content[col+1]['photo_url'])
                    story.add_to_context('photo_shape', content[col + 1]['photo_shape'])
                    story.add_to_context('photo_align', content[col + 1]['photo_align'])
                    story.add_to_context('photo_caption', content[col + 1]['photo_caption'])
                    item_dict = {'cell_type': 'story', 'story': story, 'width':width}
                    row_snip.append(item_dict)
                elif content[col+1]['cell_type'] == 'calendar':
                    calendar = self.create_calendar('stuff', width)
                    item_dict = {'cell_type': 'calendar', 'calendar': calendar, 'width': width}
                    row_snip.append(item_dict)
            all_snips.append(row_snip)

        self.context['snips'] = all_snips
        return self.context

    def create_story(self, page_name, width):
        story = Story(self.session, width)
        story.create_story_from_db(page_name=page_name)
        story.create_snippet()
        return story

    def create_calendar(self, details, width):
        calendar = Calendar(self.session, width)
        calendar.create_daily_plugin(details, 'xx')
        return calendar


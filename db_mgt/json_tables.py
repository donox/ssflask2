from ssfl import db
import datetime as dt
from sqlalchemy.orm import defer
import json as jsn


def get_name_type(descriptor_name: str) -> int:
    # Case 1: X_NAME for X = S, P
    # Case 2: NAME
    # Case 3: name
    # Case 4: F_xxxx
    name = descriptor_name
    if len(name) > 1 and name[0:2] in ('P_', 'S_', 'F_'):
        name = name[2:]
        if name[0:2] == 'F_':
            return 4
        if name.upper() == name:
            return 1
    elif name.upper() == name:
        return 2
    else:
        return 3


class JSONStorageManager(object):
    # Basic Structure
    # Names are prepended with P_ to indicate a prototype
    # Names are prepended with S_ to indicate that the corresponding DB entry (with a 'P_' substituted
    #      for the 'S_') can be substituted and expanded.
    # Names that are all cap are assumed to be of type prototype (no user names have all caps)
    # All prototypes are in the form of a list with the first element of the list being the name (remove 'P_' if there)
    #     and the remainder are processed to form a dictionary/context.  This implies that 'str' entries that are not
    #     expanded are names whose value will be 'None' (json 'null').  Lists are in Prototype form and dictionaries
    #     are merged with the parent dictionary.
    descriptor_page_layout = {"PAGE": None, "name": None, "rows": []}
    descriptor_row_layout = {"ROW": None, "columns": []}
    descriptor_column_layout = {"COLUMN": None, "cells": [], "column_width": None}
    descriptor_cell_layout = {"CELL": None, "element_type": None, "element": None, "width": None}
    descriptor_button_fields = {"BUTTON": None, "id": None, "button_type": None, "target": None, "text_content": None}

    # Content Types
    descriptor_picture_fields = {"PICTURE": None, "id": None, "url": None, "title": None, "caption": None,
                                 "width": None, "height": None, "alignment": None, "alt_text": None,
                                 "css_style": None, "css_class": None, "title_class": None,
                                 "caption_class": None, "image_class": None}
    descriptor_slideshow_fields = {"SLIDESHOW": None, "title": None, "title_class": None, "position": None,
                                   "width": None, "height": None, "rotation": None,
                                   "frame_title": None, "pictures": []}
    descriptor_story_fields = {"STORY": None, "id": None, "title": None, "name": None, "author": None,
                               "date": None, "content": None, "snippet": None}

    # Snippets
    descriptor_story_snippet_fields = {"STORY_SNIPPET": None, "id": None, "title": None, "name": None, "author": None,
                                       "date": None, "snippet": None, "photo": None,
                                       "content": None, "story_url": None, "read_more": None}
    descriptor_calendar_snippet_fields = {"CALENDAR_SNIPPET": None, "events": [], "event_count": None}
    descriptor_event_snippet_fields = {"EVENT_SNIPPET": None, "name": None, "date": None, "time": None, "venue": None}

    # Complex/predefined types
    descriptor_row_with_single_cell_fields = {"SINGLECELLROW": None,
                                              "rows": [{"ROW": None, "columns": [
                                                  {"COLUMN": None, "cells": ["S_CELL"],
                                                   "column_width": None, "descriptor": "COLUMN"}
                                              ]}],
                                              "descriptor": "SINGLECELLROW"
                                              }
    descriptor_single_cell_table_fields = {"ONECELL": None, "name": None,
                                           "S_SINGLECELLROW": None, "descriptor": "ONECELL"}
    descriptor_three_cell_row_fields = {"THREECELLROW": None,
                                        "columns": [{"COLUMN": None,
                                                     "cells": [{"CELL": None, "descriptor": "CELL",
                                                                "element_type": None, "element": None, "width": None}]},
                                                    {"COLUMN": None,
                                                     "cells": [{"CELL": None, "descriptor": "CELL",
                                                                "element_type": None, "element": None, "width": None}]},
                                                    {"COLUMN": None,
                                                     "cells": [{"CELL": None, "descriptor": "CELL",
                                                                "element_type": None, "element": None, "width": None}]}
                                                    ],
                                        "descriptor": "THREECELLROW"}
    descriptor_front_page_fields = {"FRONTPAGE": None,
                                    "name": None,
                                    "rows": [{"ROW": None,
                                              "columns": [
                                                  "F_ONECELLCOLUMN", "F_ONECELLCOLUMN", "F_ONECELLCOLUMN"],
                                              "column_width": None,
                                              "descriptor": "ROW"},
                                             "S_ROW",
                                             {"ROW": None,
                                              "columns": [
                                                  "F_ONECELLCOLUMN", "F_ONECELLCOLUMN", "F_ONECELLCOLUMN"],
                                              "column_width": None,
                                              "descriptor": "ROW"},
                                             {"ROW": None,
                                              "columns": [
                                                  "F_ONECELLCOLUMN", "F_ONECELLCOLUMN", "F_ONECELLCOLUMN"],
                                              "column_width": None,
                                              "descriptor": "ROW"}
                                             ],
                                    "descriptor": "FRONTPAGE"}

    def __init__(self, db_session):
        self.db_session = db_session
        cls = JSONStorageManager
        self.all_fields = dict()
        self.all_fields['PAGE'] = cls.descriptor_page_layout
        self.all_fields['ROW'] = cls.descriptor_row_layout
        self.all_fields['COLUMN'] = cls.descriptor_column_layout
        self.all_fields['CELL'] = cls.descriptor_cell_layout
        self.all_fields['BUTTON'] = cls.descriptor_button_fields

        self.all_fields['PICTURE'] = cls.descriptor_picture_fields
        self.all_fields['SLIDESHOW'] = cls.descriptor_slideshow_fields
        self.all_fields['STORY'] = cls.descriptor_story_fields

        self.all_fields['STORY_SNIPPET'] = cls.descriptor_story_snippet_fields
        self.all_fields['CALENDAR_SNIPPET'] = cls.descriptor_calendar_snippet_fields
        self.all_fields['EVENT_SNIPPET'] = cls.descriptor_event_snippet_fields
        self.all_fields['SINGLECELLROW'] = cls.descriptor_row_with_single_cell_fields
        self.all_fields['ONECELL'] = cls.descriptor_single_cell_table_fields
        self.all_fields['THREECELLROW'] = cls.descriptor_three_cell_row_fields
        self.all_fields['FRONTPAGE'] = cls.descriptor_front_page_fields
        # self.all_fields[''] = cls.

        self.template_functions = dict()
        self.template_functions['ONECELLCOLUMN'] = self._f_onecellcolumn

    def _f_onecellcolumn(self, **kwargs):
        col = self.make_json_descriptor(self.get_json_from_name('P_COLUMN'))
        col['descriptor'] = 'COLUMN'
        cell = self.make_json_descriptor(self.get_json_from_name('P_CELL'))
        cell['descriptor'] = 'CELL'
        col['cells'].append(cell)
        current_result = kwargs['current_result']
        # col is a dictionary with a value 'columns' that
        current_result['columns'].append(col['columns'][0])
        return


    def update_db_with_descriptor_prototype(self):
        """Update the definitions of each descriptor in the database as a prototype."""
        for key, val in self.all_fields.items():
            db_name = 'P_' + key
            if self.get_json_from_name(db_name):
                self.delete_descriptor(db_name)
            desc = self.make_json_descriptor(val)
            desc['descriptor'] = key
            self.add_json(db_name, desc)

    def make_json_descriptor(self, descriptor: dict):
        # Names are prepended with P_ to indicate a prototype
        # Names are prepended with S_ to indicate that the corresponding DB entry (with a 'P_' substituted
        #      for the 'S_') can be substituted and expanded.
        # Names that are all cap are assumed to be of type prototype (no user names have all caps)
        # All descriptors are in the form of a dictionary.  Each has a 'descriptor' property whose value is
        #       the name of the object for use in a template context.
        res = dict()
        if type(descriptor) == str:
            tmp = get_name_type(descriptor)
            # Case 1: X_NAME
            # Case 2: NAME
            # Case 3: name
            # Case 4: F_function
            if tmp == 1:
                tmp_res = self.make_json_descriptor(self.get_json_from_name('P_' + descriptor[2:]))
                tmp_res['descriptor'] = descriptor[2:]
                return tmp_res
            elif tmp == 2:
                tmp_res = self.make_json_descriptor(self.get_json_from_name('P_' + descriptor))
                tmp_res['descriptor'] = descriptor
                return tmp_res
            elif tmp == 3:
                return self.make_json_descriptor(self.get_json_from_name(descriptor))
            elif tmp == 4:
                function = descriptor[2:]
                raise ValueError(f'Attempt to perform an unknown function: {function}')
            else:
                raise ValueError(f'Unknown JSON Type: {descriptor}')

        else:
            desc_type = None
            for desc_key, desc_val in descriptor.items():
                if desc_key == 'descriptor':
                    desc_type = desc_val        # Avoid infinite recursion by re-expanding element - add at bottom
                elif type(desc_key) == str and len(desc_key) > 1 and desc_key[0:2] == 'S_':
                    new_json = self.get_json_from_name('P_' + desc_key[2:])
                    return self.make_json_descriptor(new_json)
                elif desc_val is None:
                    res[desc_key] = None
                elif type(desc_val) == dict:
                    for key, val in desc_val.items():
                        if type(val) == list:
                            new_val = []
                            if len(val):
                                for new_el in val:
                                    if type(new_el) == list:
                                        new_val.append(self.make_json_descriptor(new_el))
                                    else:
                                        new_val.append(self.make_json_descriptor(val))
                            res.append({key: new_val})
                        elif type(val) == dict:
                            res[key] = self.make_json_descriptor(val)
                        elif type(val) == str:
                            tmp = get_name_type(val)
                            if tmp == 1:
                                desc_name = 'P_' + val[2:]
                                new_json = self.get_json_from_name(desc_name)
                                new_desc = self.make_json_descriptor(new_json)
                                new_desc["descriptor"] = desc_val[2:]
                                res[desc_val[2:]] = new_desc
                            elif tmp == 2:
                                new_json = self.get_json_from_name('P_' + val)
                                new_desc = self.make_json_descriptor(new_json)
                                new_desc["descriptor"] = desc_val
                                res[desc_val] = new_desc
                            elif tmp == 3:
                                res[new_desc["descriptor"]] = new_desc
                            else:
                                raise ValueError(f'Unknown JSON Type: {val}')
                        else:
                            raise ValueError(f'Invalid type for json dictionary value.  Key: {key}, Value: {val}')
                elif type(desc_val) == list:
                    list_res = []
                    for item in desc_val:
                        list_res.append(self.make_json_descriptor(item))
                    res[desc_key] = list_res
                elif type(desc_val) == str:
                    # Case 1: X_NAME
                    # Case 2: NAME
                    # Case 3: name
                    # Case 4: F_xxx
                    tmp = get_name_type(desc_val)
                    if tmp == 1:
                        desc_name = 'P_' + desc_val[2:]
                        new_json = self.get_json_from_name(desc_name)
                        new_desc = self.make_json_descriptor(new_json)
                        new_desc["descriptor"] = desc_val[2:]
                        res[desc_val[2:]] = new_desc
                    elif tmp == 2:
                        new_json = self.get_json_from_name('P_' + desc_val)
                        new_desc = self.make_json_descriptor(new_json)
                        new_desc["descriptor"] = desc_val
                        res[desc_val] = new_desc
                    elif tmp == 3:
                        res[new_desc["descriptor"]] = new_desc
                    elif tmp == 4:
                        foo = 3
                    else:
                        raise ValueError(f'Unknown JSON Type: {desc_val}')
            res['descriptor'] = desc_type
        return res

    @staticmethod
    def convert_descriptor_list_to_dict(desc):
        """Convert a descriptor in form of a list to a dictonary for use as a context object

        Args:
            desc: list: names of elements in descriptor

        Returns:    dict: with elements of descriptor

        """
        res = dict()
        for el in desc[1:]:  # first element of descriptor is type
            res[el] = None
        return res

    def get_json_from_name(self, name):
        res = self.db_session.query(JSONStore).filter(JSONStore.name == name).first()
        if res:
            json = jsn.loads(res.content)
            return json
        else:
            return None

    def get_json_from_id(self, id_nbr):
        res = self.db_session.query(JSONStore).filter(JSONStore.id == id_nbr)
        if res:
            json = jsn.loads(res.first())
            return json
        else:
            return None

    def add_json(self, name, content):
        exists = self.get_json_from_name(name)
        if type(content) is str:
            json_content = content
        else:
            json_content = jsn.dumps(content)
        today = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if exists:
            db_row = self.db_session.query(JSONStore).filter(JSONStore.name == name).first()
            db_row.content = json_content
            db_row.last_update = today
            db_row.status = "active"
            self.db_session.commit()
        else:
            db_row = JSONStore(name=name, content=json_content, status='active', last_update=today)
            db_row.add_to_db(self.db_session, commit=True)

    def delete_descriptor(self, name):
        exists = self.get_json_from_name(name)
        if exists:
            db_row = self.db_session.query(JSONStore).filter(JSONStore.name == name).delete()
            self.db_session.commit()


class JSONStore(db.Model):
    __tablename__ = 'json_store'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(), nullable=False, unique=True)
    active = db.Column(db.Boolean(), default=True)
    last_update = db.Column(db.DateTime, default='2000-01-01')
    content = db.Column(db.String(), nullable=True)
    status = db.Column(db.String(32), nullable=False)

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
                raise e
        return self

from ssfl import db
import datetime as dt
from sqlalchemy.orm import defer
import json as jsn
from collections import defaultdict


def get_name_type(name: str) -> int:
    # Case 1: X_NAME for X = S, P
    # Case 2: NAME
    # Case 3: name
    # Case 4: F_xxxx
    if len(name) > 1 and name[0:2] in ('P_', 'S_', 'F_', 'N_'):
        if name[0:2] == 'F_':
            return 'FUNCTION'
        elif name[0:2] == 'N_':
            return 'NOPROCESS'
        else:
            return 'PREAMBLE'
    elif name.upper() == name:
        return 'UPPER'
    else:
        return 'NORMAL'


def xget_name_type(descriptor_name: str) -> int:
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


class _KeepResult(object):
    """Internal object to accumulate the result of a descriptor expansion

    """

    def __init__(self):
        self.result = defaultdict(lambda: 'NO VALUE GIVEN')
        self.res_key = 'UNUSED'
        self.res_val = 'UNUSED'

    def add_to_result(self, key, val):
        self.result[key] = val

    def add_key_value_pair_to_result(self, name, val):
        self.result['descriptor'] = name
        self.result[name] = val

    def add_key_to_result(self, key):
        if self.res_val != 'UNUSED':
            self.result[key] = self.res_val
        else:
            self.res_key = key

    def add_value_to_result(self, val):
        if self.res_key != 'UNUSED':
            self.result[self.res_key] = val
        else:
            self.res_val = val

    def add_descriptor_to_result(self, desc):
        name = desc['descriptor']
        self.result[name] = desc

    def get_result(self):
        res = dict(self.result)
        if res:
            for key, val in res.items():
                if val == 'REMOVE':
                    res.pop(key)
                    break
            if res:
                return res
            else:
                return None  # type is None rather than empty dict
        if self.res_val != 'UNUSED':
            return self.res_val
        if self.res_key != 'UNUSED':
            return {self.res_key: None}
        raise SystemError(f'Request for result, but nothing has been specified.')


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
                               "date": None, "content": None, "snippet": "S_STORY_SNIPPET"}

    # Snippets
    descriptor_story_snippet_fields = {"STORY_SNIPPET": None, "id": None, "title": None, "name": None, "author": None,
                                       "date": None, "snippet": None, "photo": "S_PICTURE",
                                       "content": None, "story_url": None, "read_more": "S_BUTTON"}
    descriptor_calendar_snippet_fields = {"CALENDAR_SNIPPET": None, "events": [], "event_count": None}
    descriptor_event_snippet_fields = {"EVENT_SNIPPET": None, "name": None, "date": None, "time": None, "venue": None}

    # Complex/predefined types
    descriptor_row_with_single_cell_fields = {"SINGLECELLROW": "REMOVE",
                                              "ROW": {"columns": [
                                                  {"COLUMN": None, "cells": ["S_CELL"],
                                                   "column_width": None, "descriptor": "COLUMN"}],
                                                  "descriptor": "ROW"},
                                              "descriptor": "SINGLECELLROW"}
    descriptor_single_cell_table_fields = {"ONECELL": "REMOVE", "PAGE": "S_SINGLECELLROW", "descriptor": "PAGE"}
    descriptor_three_cell_row_fields = {"THREECELLROW": "REMOVE",
                                        "ROW": {"columns": [{"COLUMN": None, "descriptor": "COLUMN",
                                                             "cells": [{"CELL": None, "descriptor": "CELL",
                                                                        "element_type": "N_STORY_SNIPPET",
                                                                        "element": "P_STORY_SNIPPET",
                                                                        "width": 400}]},
                                                            {"COLUMN": None,
                                                             "cells": [{"CELL": None, "descriptor": "CELL",
                                                                        "element_type": "N_STORY_SNIPPET",
                                                                        "element": "P_STORY_SNIPPET",
                                                                        "width": 400}]},
                                                            {"COLUMN": None,
                                                             "cells": [{"CELL": None, "descriptor": "CELL",
                                                                        "element_type": "N_STORY_SNIPPET",
                                                                        "element": "P_STORY_SNIPPET",
                                                                        "width": 400}]},
                                                            ],
                                                "descriptor": "ROW"},
                                        "descriptor": "THREECELLROW"}

    descriptor_front_page_fields = {"FRONTPAGE": "REMOVE",
                                    "PAGE": {"name": None,
                                             "rows": ["S_THREECELLROW", "S_THREECELLROW", "S_THREECELLROW"]},
                                    "descriptor": "PAGE"}

    descriptor_test_fields = {"ONECELL": "REMOVE", "PAGE": "S_SINGLECELLROW", "descriptor": "PAGE"}

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
        # NEEDS REWRITING???
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

    def make_json_descriptor(self, descriptor: dict, result_processor: object = None):
        rlt = _KeepResult()

        if isinstance(descriptor, str):
            # All str types will return their value - no need to add to result dict
            tmp = get_name_type(descriptor)
            if tmp == 'FUNCTION':
                function = self.template_functions[descriptor[2:]]
                result = function()
                raise SystemError('Function call templates not yet implemented')
            elif tmp == 'PREAMBLE':
                desc = self.get_json_from_name('P_' + descriptor[2:])
                result = self.make_json_descriptor(desc)
                result.pop('descriptor')
                rlt.add_value_to_result(result)
            elif tmp == 'NOPROCESS':
                rlt.add_value_to_result(descriptor[2:])
            elif tmp == 'UPPER':
                result = self.get_json_from_name('P_' + descriptor)  # ?? right??
                if not result:
                    rlt.add_value_to_result(descriptor)
                elif isinstance(result, dict):
                    rlt.add_key_value_pair_to_result(result['descriptor'], result)
                else:
                    raise ValueError(f'Invalid value of type "UPPER" for descriptor: {descriptor}')
            elif tmp == 'NORMAL':
                result = self.get_json_from_name(descriptor)
                if not isinstance(result, dict):
                    foo = 3
                rlt.add_key_value_pair_to_result(result['descriptor'], result)
            else:
                raise ValueError(f'Invalid descriptor string type: {tmp}')
        # elif isinstance(descriptor, list):
        #     pass
        elif isinstance(descriptor, dict):
            for key, val in descriptor.items():
                key_type = get_name_type(key)
                if key_type in ['UPPER', 'NORMAL']:
                    rlt.add_key_to_result(key)
                elif key_type == 'NOPROCESS':
                    rlt.add_key_to_result(descriptor[2:])
                else:
                    # NOTE:  key in ['PREAMBLE', 'FUNCTION'], so it is equivalent to a key/value pair
                    res = self.make_json_descriptor(key)
                    if 'descriptor' in res:
                        rlt.add_key_value_pair_to_result(res['descriptor'], res)
                    else:
                        rlt.add_value_to_result(res)
                if key_type in ['PREAMBLE', 'FUNCTION']:
                    pass  # No value part in this case
                elif not val:
                    rlt.add_value_to_result(val)  # val is None - NEED TO ADD WHEN NOT PREAMBLE/FUNCTION
                elif isinstance(val, str) or isinstance(val, int):  # THIS COULD BE TOO WEAK
                    if key == 'descriptor':
                        rlt.add_key_value_pair_to_result(key, val)
                    elif isinstance(val, str):
                        val_type = get_name_type(val)
                        if val_type in ['UPPER', 'NORMAL']:
                            rlt.add_value_to_result(val)
                        else:
                            # NOTE:  key in ['PREAMBLE', 'FUNCTION'], so it is equivalent to a key/value pair
                            res = self.make_json_descriptor(val)
                            if 'descriptor' in res:
                                rlt.add_key_value_pair_to_result(res['descriptor'], res)
                            else:
                                rlt.add_value_to_result(res)
                        if val_type in ['PREAMBLE', 'FUNCTION']:
                            pass  # No key part in this case
                        # self.make_json_descriptor(val, result_processor=rlt.add_value_to_result)
                    else:
                        rlt.add_key_value_pair_to_result(key, val)
                elif isinstance(val, list):
                    rel_list = []
                    for list_item in val:
                        rel_list.append(self.make_json_descriptor(list_item))
                    rlt.add_value_to_result(rel_list)
                elif isinstance(val, dict):
                    self.make_json_descriptor(val, result_processor=rlt.add_value_to_result)
                else:
                    raise ValueError(f'Dictionary value type not recognized: {val}')
        result = rlt.get_result()
        if result_processor:
            result_processor(result)
        else:
            return result

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

    def find_instances(self, template, target):
        """Create generator to find instances of target in template - depth first tree walk.

        Args:
            template: 'JSON' template to search
            target: entry type expected in template

        Returns: instance of dictionary of type target

        """
        if not template:
            return None
        if isinstance(template, dict):
            if target in template:
                yield template
            for key, val in template.items():
                if isinstance(val, dict):
                    for x in self.find_instances(val, target):
                        yield x
                elif isinstance(val, list):
                    for elem in val:
                        for x in self.find_instances(elem, target):
                            yield x
                else:
                    pass
            return None
        elif isinstance(template, list):
            for elem in template:
                for x in self.find_instances(elem, target):
                    yield x
        else:
            return None

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


"""
    Building json descriptors:
    
    All descriptors are either single strings or dictionaries (lists provide no consistent way to identify them for 
    lookup purposes.
    Single strings may:
        (1) Identify an object that needs to be processed.
            (a) Name to be looked up in a database and substituted.  Any database entry may be reprocessed.  If no
                further processing is required, it is idempotent. 
            (b) Names that are all upper case are intended to be replaced if they have a prefix of 'X_' where 'X' 
                indicates their intended behavior.  Names that do not have such a prefix typically identify a
                structure (e.g., ROW, PAGE, ...) that can have meaning in the template environment.
        (2) Names that are not all upper case occurring during the processing of a descriptor stand for themselves
            without further processing.  The database contains descriptors that are selected by name (all forms) 
            before descriptor processing.
    Dictionaries:
        (1) Have a minimal structure that includes two entries:
            (a) A 'descriptor' key whose value is the "name" of the dictionary.  This allows code to determine the 
                name of the dictionary for use in outside processing.
            (b) A "name" (given by the descriptor) with an arbitrary value (often null).  The interpretation of the 
                value of the name key is set by external code.  It can be expanded like any other structure.
        (2) Have an arbitrary collection of key-value pairs.  Both keys and values are evaluated and processed for 
            further expansion.
        (3) Dictionaries are processed by creating a new, empty dictionary and building it based on the descriptor 
            currently being processed. This implies that the result of the expansion of a portion of the existing 
            descriptor is (a) added as a list element to the new result, (b) a key {results in a string} that is 
            added with a value to be associated with it, (c) a value that is associated with a key in the existing
            dictionary.  b and c together with names self-evaluating imply that processing a dictionary element
            results in two parts that combine to make a new dictionary element.
    
        
"""

from ssfl import db
import datetime as dt
import toml
import copy
import json as jsn
from collections import defaultdict
from .base_table_manager import BaseTableManager
from sqlalchemy.exc import IntegrityError
from typing import List, Any, Dict, Text, NoReturn
from collections import OrderedDict
from utilities.template_support import merge_json_descriptors, build_descriptors_from_prototypes


class JSONTableManager(BaseTableManager):
    def __init__(self, db_session):
        super().__init__(db_session)
        self.db_session = db_session
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

    def get_json_primary_templates(self):
        return JSONStorageManager.json_primary_templates

    def expand_json_descriptor(self, child_dict: dict) -> dict:
        """Merge descriptor into its parent making fully specified descriptor."""
        try:
            parent_slug = None
            if 'parent' in child_dict:
                parent_slug = child_dict['parent']
                del child_dict['parent']
            elif len(child_dict.keys()) == 1:
                key = next(iter(child_dict))
                down_1 = child_dict[key]
                if 'parent' in down_1:
                    parent_slug = down_1['parent']
                    del (down_1['parent'])
            if not parent_slug:
                return child_dict
            if parent_slug.startswith('P_'):
                res = build_descriptors_from_prototypes(child_dict)
            else:
                parent = self.get_json_from_name(parent_slug)
                res = merge_json_descriptors(child_dict, copy.deepcopy(parent))
                return res
        except Exception as e:
            raise e

    def make_json_descriptor(self, descriptor: Any, result_processor: object = None):
        rlt = _KeepResult()

        if isinstance(descriptor, str):
            # All str types will return their value - no need to add to result dict
            tmp = get_name_type(descriptor)
            if tmp == 'FUNCTION':
                function = self.template_functions[descriptor[2:]]
                function()
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

    def get_json_from_id(self, id_nbr):
        res = self.db_session.query(JSONStore).filter(JSONStore.id == id_nbr)
        if res:
            json = jsn.loads(res.first())
            return json
        else:
            return None

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

    def get_json_from_name(self, name):
        """Find template as json from database by name or return None.

        Args:
            name: Template name

        Returns:  Template as json dict.

        """
        sql = f'select * from json_store where name="{name}"'
        res = self.db_session.execute(sql).first()
        if res:
            json = jsn.loads(res.content)
            return json
        else:
            return None

    def get_json_record_by_name_or_id(self, json_id, json_name):
        if json_id:
            json_store_obj = self.db_session.query(JSONStore).filter(JSONStore.id == json_id).first()
        else:
            json_store_obj = self.db_session.query(JSONStore).filter(JSONStore.name == json_name).first()
        return json_store_obj

    def add_json(self, name, content):
        """Add or update JSON template (as str or JSON) in database.

        Args:
            name: str name of template
            content: Content to be added, may be JSON in string form or JSON dict

        Returns:

        """
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

    def update_db_with_descriptor_prototype(self):
        """Update the definitions of each descriptor in the database as a prototype."""
        json_object = JSONStorageManager.json_field_dictionary
        for key, val in json_object.items():
            db_name = 'P_' + key
            if self.get_json_from_name(db_name):
                self.delete_descriptor(db_name)
            desc = self.make_json_descriptor(val)
            desc['descriptor'] = key
            self.add_json(db_name, desc)

    def delete_descriptor(self, name):
        exists = self.get_json_from_name(name)
        if exists:
            self.db_session.query(JSONStore).filter(JSONStore.name == name).delete()
            self.db_session.commit()

    def get_descriptor_as_toml(self, name):
        desc = self.get_json_from_name(name)
        toml_str = toml.dumps(desc.content)
        return toml_str


def get_name_type(name: str) -> int:
    """Converts a JSON descriptor name to a type to drive the parser.
    """
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
    # Names prepended with N_ are used as is without further processing.
    # Names that are all cap are assumed to be of type prototype (no user names have all caps)
    # All prototypes are in the form of a list with the first element of the list being the name (remove 'P_' if there)
    #     and the remainder are processed to form a dictionary/context.  This implies that 'str' entries that are not
    #     expanded are names whose value will be 'None' (json 'null').  Lists are in Prototype form and dictionaries
    #     are merged with the parent dictionary.
    descriptor_page_layout = {"PAGE": None, "node_name": "PAGE", "name": None, "rows": []}
    descriptor_row_layout = {"ROW": None, "node_name": "ROW", "columns": []}
    descriptor_column_layout = {"COLUMN": None, "node_name": "COLUMN", "cells": [], "column_width": None}
    descriptor_cell_layout = {"CELL": None, "node_name": "CELL", "element_type": None, "element": None,
                              "is_snippet": None,
                              "width": None, "height": None, "styles": None, "classes": None}
    descriptor_button_fields = {"BUTTON": None, "node_name": "BUTTON", "id": None, "button_type": None, "target": None,
                                "text_content": None}

    # Content Types
    descriptor_picture_fields = {"PICTURE": None, "node_name": "PICTURE", "id": None, "url": None, "title": None,
                                 "caption": None,
                                 "width": None, "height": None, "alignment": None, "alt_text": None,
                                 "css_style": None, "css_class": None, "title_class": None,
                                 "caption_class": None, "image_class": None}
    descriptor_slideshow_fields = {"SLIDESHOW": None, "node_name": "SLIDESHOW", "title": None, "title_class": None,
                                   "position": None,
                                   "width": None, "height": None, "rotation": None,
                                   "frame_title": None, "pictures": []}
    descriptor_story_fields = {"STORY": None, "node_name": "STORY", "id": None, "title": None, "name": None,
                               "author": None,
                               "date": None, "content": None, "snippet": "S_STORY_SNIPPET"}

    # Snippets
    descriptor_story_snippet_fields = {"STORY_SNIPPET": None, "node_name": "STORY_SNIPPET", "id": None, "title": None,
                                       "name": None, "author": None,
                                       "date": None, "snippet": None, "photo": "S_PICTURE",
                                       "content": None, "story_url": None, "read_more": "S_BUTTON"}
    descriptor_calendar_snippet_fields = {"CALENDAR_SNIPPET": None, "node_name": "CALENDAR_SNIPPET", "events": [],
                                          "event_count": None, "width": None,
                                          "audience": [], "categories": []}
    descriptor_slideshow_snippet_fields = {"SLIDESHOW_SNIPPET": None, "node_name": "SLIDESHOW_SNIPPET", "id": None,
                                           "title": None, "text": None,
                                           "slides": "S_SLIDESHOW"}
    descriptor_event_snippet_fields = {"EVENT_SNIPPET": None, "node_name": "EVENT_SNIPPET", "name": None, "date": None,
                                       "time": None, "venue": None}
    descriptor_sign_snippet_fields = {"SIGN_SNIPPET": None, "node_name": "SIGN_SNIPPET", "name": None,
                                      "content_type": None, "content": None,
                                      "styling": None}

    # Complex/predefined types
    descriptor_row_with_single_cell_fields = {"SINGLECELLROW": "REMOVE",
                                              "ROW": {"columns": [
                                                  {"COLUMN": None, "cells": ["S_CELL"],
                                                   "column_width": None, "descriptor": "COLUMN",
                                                   "node_name": "COLUMN"}],
                                                  "descriptor": "ROW", "node_name": "ROW"},
                                              "descriptor": "SINGLECELLROW"}
    descriptor_single_cell_table_fields = {"ONECELL": "REMOVE", "PAGE": "S_SINGLECELLROW", "descriptor": "PAGE"}
    descriptor_three_cell_row_fields = {"THREECELLROW": "REMOVE",
                                        "ROW": {
                                            "columns": [{"COLUMN": None, "descriptor": "COLUMN", "node_name": "COLUMN",
                                                         "cells": ["S_CELL"]},
                                                        {"COLUMN": None, "node_name": "COLUMN",
                                                         "cells": ["S_CELL"]},
                                                        {"COLUMN": None, "node_name": "COLUMN",
                                                         "cells": ["S_CELL"]},
                                                        ],
                                            "descriptor": "ROW", "node_name": "ROW"},
                                        "descriptor": "THREECELLROW"}

    descriptor_front_page_fields = {"FRONTPAGE": "REMOVE",
                                    "PAGE": {"name": None, "node_name": "PAGE",
                                             "rows": ["S_THREECELLROW", "S_THREECELLROW", "S_THREECELLROW"]},
                                    "descriptor": "PAGE"}

    descriptor_test_fields = {"ONECELL": "REMOVE", "PAGE": "S_SINGLECELLROW", "descriptor": "PAGE", "node_name": "PAGE"}

    json_field_dictionary = dict()
    json_field_dictionary['PAGE'] = descriptor_page_layout
    json_field_dictionary['ROW'] = descriptor_row_layout
    json_field_dictionary['COLUMN'] = descriptor_column_layout
    json_field_dictionary['CELL'] = descriptor_cell_layout
    json_field_dictionary['BUTTON'] = descriptor_button_fields

    json_field_dictionary['PICTURE'] = descriptor_picture_fields
    json_field_dictionary['SLIDESHOW'] = descriptor_slideshow_fields
    json_field_dictionary['STORY'] = descriptor_story_fields

    json_field_dictionary['STORY_SNIPPET'] = descriptor_story_snippet_fields
    json_field_dictionary['CALENDAR_SNIPPET'] = descriptor_calendar_snippet_fields
    json_field_dictionary['EVENT_SNIPPET'] = descriptor_event_snippet_fields
    json_field_dictionary['SIGN_SNIPPET'] = descriptor_sign_snippet_fields
    json_field_dictionary['SLIDESHOW_SNIPPET'] = descriptor_slideshow_snippet_fields
    json_field_dictionary['SINGLECELLROW'] = descriptor_row_with_single_cell_fields
    json_field_dictionary['ONECELL'] = descriptor_single_cell_table_fields
    json_field_dictionary['THREECELLROW'] = descriptor_three_cell_row_fields
    json_field_dictionary['FRONTPAGE'] = descriptor_front_page_fields

    # json_field_dictionary[''] = cls.
    json_primary_templates = ['PAGE', 'ROW', 'COLUMN', 'CELL', 'BUTTON', 'PICTURE', 'SLIDESHOW', 'STORY',
                              'STORY_SNIPPET', 'CALENDAR_SNIPPET', 'EVENT_SNIPPET', 'SIGN_SNIPPET', 'SLIDESHOW_SNIPPET']

    def __init__(self, db_exec):
        self.db_exec = db_exec
        self.all_fields = JSONStorageManager.json_field_dictionary
        self.table_manager = self.db_exec.create_json_manager()
        self.template_functions = dict()


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
            except IntegrityError as e:  # TODO: log error and report
                raise e
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

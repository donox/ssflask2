from ssfl import db
import datetime as dt
import toml
import copy
import json as jsn
from collections import defaultdict
from .base_table_manager import BaseTableManager
from .json_storage_manager import JSONStorageManager
from sqlalchemy.exc import IntegrityError
from typing import List, Any, Dict, Text, NoReturn
from ssfl import sst_syslog
from collections import OrderedDict
from utilities.template_support import merge_json_descriptors, build_descriptors_from_prototypes


class JSONTableManager(BaseTableManager):
    def __init__(self, db_session):
        super().__init__(db_session)
        self.db_session = db_session
        self.template_functions = dict()
        self.template_functions['ONECELLCOLUMN'] = self._f_onecellcolumn
        self.get_json_field_value = self.get_table_value('json_store')

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

    def get_all_templates(self):
        sql = 'select * from json_store order by last_update desc;'
        res = self.db_session.execute(sql).fetchall()
        res_list = []
        for template in res:
            gv = self.get_json_field_value(template)
            entry = JSONStore(id=gv('id'), name=gv('name'), last_update=gv('last_update'), active=gv('active'),
                              status=gv('status'), content=gv('content'))
            res_list.append(entry)
        return res

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
                res = build_descriptors_from_prototypes(child_dict, self)
                is_prototype = False
                merge_json_descriptors(child_dict, res, is_prototype)
                return res
            else:
                parent = self.get_json_from_name(parent_slug)
                if not parent:
                    raise ValueError(f'No template named {parent_slug} - did you forget a leading "P_"?')
                is_prototype = False  # TODO: Where should this be set???
                res = copy.deepcopy(parent)
                merge_json_descriptors(child_dict, res, is_prototype)
                return res
        except Exception as e:
            raise e

    def make_json_descriptor(self, descriptor: Any, result_processor: object = None):
        """Expand/elaborate (recursively if needed) a descriptor to produce structure to drive processing.

        Produce a descriptor with notations (types) such as PREAMBLE (a.k.a., prototype) replaced with their
        expansions.  An expanded descriptor will most often result in a structure in which all parameters
        are specified (with default values) can be used as a jinja2 context for template layout.  An infrequently
        used result_process may be called with the result of the expansion to perform additional work.

        Args:
            descriptor: JSON structure defined in JSONStorageManager
            result_processor: function to be called on result of expansion

        Returns:  dict result of expansion

        """
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
                if result:
                    rlt.add_key_value_pair_to_result(result['descriptor'], result)
                else:
                    # descriptor is a name that is it's own value
                    rlt.add_value_to_result(descriptor)
            else:
                # A string that does not match the above criteria is defined to be a descriptor
                # whose representation is its name
                return descriptor
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
                    raise SystemError(f'Dictionary value type not recognized: {val}')
        else:
            raise SystemError(f'Descriptor is neither string nor dict: {descriptor}')
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
        try:
            json_object = JSONStorageManager.json_field_dictionary
            for key, val in json_object.items():
                db_name = 'P_' + key
                if self.get_json_from_name(db_name):
                    self.delete_descriptor(db_name)
                desc = self.make_json_descriptor(val)
                if type(desc) is dict:              # can this be pushed into the maker??
                    desc['descriptor'] = key
                self.add_json(db_name, desc)
        except Exception as e:
            sst_syslog.make_error_entry(f'Error updating database prototype descriptors: {e.args}')
            raise e

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

    Building a descriptor is a recursive process and processing needs easy access
    to building top level structure.  This class is simply a convenient means to
    maintain state needed during the recursion
    """

    def __init__(self):
        self.result = defaultdict(lambda: 'NO VALUE GIVEN')
        self.res_key = 'UNUSED'
        self.res_val = 'UNUSED'

    def add_to_result(self, key, val):
        self.result[key] = val

    def add_key_value_pair_to_result(self, name, val):
        # self.result['descriptor'] = name
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
            except IntegrityError as e:
                sst_syslog(f'JSON table Integrity Error: {e.args}')
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

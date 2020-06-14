import toml
import json
from db_mgt.db_exec import DBExec
from utilities.sst_exceptions import NoSuchTOMLItem


def dict_to_toml(pydict: dict) -> dict:
    """Convert Python dictionary to modified dict for toml output.

    Since toml has no means of representing key-value pairs with value None, those keys are not output.  This function
    converts values in the dict to the string '.??.' which is assumed to be unique and therefore reversable.

    Args:
        pydict: Arbitrary Python dictionary

    Returns:
        Python dictionary with None values replaced with '_xxx_'

    """
    result = dict()
    for key, value in pydict.items():
        if not value:
            result[key] = '_xxx_'
        elif type(value) is dict:
            result[key] = dict_to_toml(value)
        elif type(value) is list:
            res_list = []
            for val in value:
                if type(val) is dict:
                    res_list.append(dict_to_toml(val))
                elif type(val) is list:
                    raise SystemError(f'TOML conversion of list not yet implemented')
                else:
                    res_list.append(val)
            result[key] = res_list
        else:
            result[key] = value
    return result


def toml_to_dict(toml_dict: dict) -> dict:
    """This inverts dict_to_toml replacing instances of '.??.' with None.

    Args:
        toml_dict: Python dict containing result of toml.load or toml.loads.

    Returns:
        Python dict with instances of '_xxx_' replaced with None.
    """
    result = dict()
    for key, value in toml_dict.items():
        if value == '_xxx_':
            result[key] = None
        elif type(value) is dict:
            result[key] = toml_to_dict(value)
        elif type(value) is list:
            res_list = []
            for val in value:
                if type(val) is dict:
                    res_list.append(toml_to_dict(val))
                elif type(val) is list:
                    raise SystemError(f'TOML conversion of list not yet implemented')
                else:
                    res_list.append(val)
            result[key] = res_list
        else:
            result[key] = value
    return result


def indent_toml(toml_str: str) -> str:
    """Indent toml string to improve readability.

    Indent toml representation by indenting each element to represent its depth in the structure.

    Args:
        toml_str: toml string - the result of a toml.dumps

    Returns:
        valid toml string reprentation (can be read by toml.load/toml.loads)

    """
    depth = 0
    res = list()
    toml_list = toml_str.split('\n')
    for line in toml_list:
        if line.startswith('['):
            lc = line.split('.')
            new_depth = len(lc)
            if new_depth < depth:
                depth = new_depth
                res.append('    ' * (depth - 1) + line)
            else:
                res.append('    ' * depth + line)
                depth = new_depth
        else:
            res.append('    ' * depth + line)
    return '\n'.join(res)


def dict_to_toml_file(py_dict: dict, file_path: str) -> None:
    """Write Python dictionary to file in TOML format.

    Args:
        py_dict: Python dictionary
        file_path: Path to file for output (generally a temp file)

    Returns:

    """
    with open(file_path, 'w+') as fl:
        out_toml = dict_to_toml(py_dict)
        out_toml_str = toml.dumps(out_toml)
        out_str = indent_toml(out_toml_str)
        fl.write(out_str)
        fl.close()


def elaborate_toml_list(db_exec: DBExec, toml_list: list) -> list:
    new_val = list()
    for el in toml_list:
        if type(el) is list:
            new_val.append(elaborate_toml_list(db_exec, el))
        elif type(el) is dict:
            new_val.append(elaborate_toml_dict(db_exec, el))
        else:
            new_val.append(el)
    return new_val


def elaborate_toml_dict(db_exec: DBExec, toml_dict: dict) -> dict:
    """Replace named elements (e.g., value is a string) with their content."""
    # Note this is modifying the dictionary passed in - should not be a problem
    try:
        json_mgr = db_exec.create_json_manager()
        for key, value in toml_dict.items():
            if key == 'element' and type(value) is str:
                elem_name = toml_dict['element']
                elem = json_mgr.get_json_from_name(elem_name)
                if elem:
                    toml_dict['element'] = elaborate_toml_dict(db_exec, elem)
                else:
                    db_exec.add_error_to_form('Unknown Template',
                                              f'Template: {elem_name} not found. Has it been created?')
                    raise NoSuchTOMLItem(f'TOML Item: {elem_name} does not exist.')
            elif type(value) is dict:
                toml_dict[key] = elaborate_toml_dict(db_exec, value)
            elif type(value) is list:
                toml_dict[key] = elaborate_toml_list(db_exec, value)
        return toml_dict
    except Exception as e:
        db_exec.add_error_to_form('Exception', f'TOML Support error: {e.args}')
        raise e

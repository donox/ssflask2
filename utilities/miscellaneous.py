from config import Config
import os
import sys
import re
from jinja2 import Environment, PackageLoader, select_autoescape
from typing import List


def extract_fields_to_dict(data_object, field_list):
    """Make dictionary of selected fields from an object (e.g., page, photo, ...)."""
    res = dict()
    for field in field_list:
        res[field] = getattr(data_object, field, 'NA')
    return res


def make_re_from_string(in_string: str):
    """Make re that finds content from string with wildcards."""
    parts = in_string.split('*')
    regex = r''
    for part in parts:
        regex += '.*' + part
    regex = re.compile(regex[2:])
    return regex

def make_db_search_string(in_string: str):
    """Make re that finds content from string with wildcards."""
    parts = in_string.split('*')
    search_string = r''
    for part in parts:
        search_string += '%' + part
    search_string += '%'
    return search_string


def get_temp_file_name(temp_type, extension):
    """Get a name for a temporary file, deleting any prior file of 'similar' name."""
    chars = '-' + str(Config.TEMP_CURRENT) + '.'
    for path in os.listdir(Config.TEMP_FILE_LOC):
        full_path = os.path.join(Config.TEMP_FILE_LOC, path)
        if full_path.find(chars) > -1:
            try_count = 5
            while try_count:
                try:
                    if os.path.exists(full_path):
                        os.remove(full_path)
                    else:
                        try_count = 0
                except FileNotFoundError as e:
                    try_count -= 1
                    if not try_count:
                        raise SystemError('os.remove fails trying to remove a file')
                except Exception as e:
                    foo = 3
                    raise e
    fl = Config.TEMP_FILE_LOC + temp_type + chars + extension
    tmp = int(Config.TEMP_CURRENT) + 1
    if tmp > int(Config.TEMP_COUNT):
        tmp = 1
    Config.TEMP_CURRENT = tmp
    return fl


def run_jinja_template(template, context):
    try:
        env = Environment(loader=PackageLoader('ssfl', 'templates'), autoescape=(['html']))
        template = env.get_template(template)
        results = template.render(context)
        return results
    except Exception as e:
        print(e.args)
        raise e


def factor_string(in_str: str, pos_list: List[int]) -> List[str]:
    """Factor input string into list of strings broken at points specified in a list of integers."""
    try:
        res = list()
        n = 0
        for m in pos_list:
            res.append(in_str[n:m])
            n = m
        res.append(in_str[m:])
        return res
    except Exception as e:
        raise ValueError(f'Error factoring string beginning: {in_str[:20]}')


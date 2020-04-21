from config import Config
import os, sys
from jinja2 import Environment, PackageLoader, select_autoescape
from typing import List


def get_temp_file_name(temp_type, extension):
    """Create name for new temp file, deleting file with that name if necessary.

    Temporary files are maintained on a rotating basis and reused.  This seems to
        avoid problems managing the closing and deleting of temporary files."""


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

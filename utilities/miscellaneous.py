from config import Config
import os, sys


def get_temp_file_name(temp_type, extension):
    """Create name for new temp file, deleting file with that name if necessary.

    Temporary files are maintained on a rotating basis and reused.  This seems to
        avoid problems managing the closing and deleting of temporary files."""


def get_temp_file_name(temp_type, extension):
    """Get a name for a temporary file, deleting any prior file of 'similar' name."""
    chars = '-' + str(Config.TEMP_CURRENT) + '.'
    for path in os.listdir(Config.TEMP_FILE_LOC):
        full_path = Config.TEMP_FILE_LOC + path
        if full_path.find(chars) > -1:
            try:
                os.remove(full_path)
            except Exception as e:
                foo = 3
                raise e
    fl = Config.TEMP_FILE_LOC + temp_type + chars + extension
    tmp = int(Config.TEMP_CURRENT) + 1
    if tmp > int(Config.TEMP_COUNT):
        tmp = 1
    Config.TEMP_CURRENT = tmp
    return fl

from config import Config
from json import dumps
from typing import Dict, AnyStr, Any
from utilities.sst_exceptions import PhotoOrGalleryMissing
from ssfl import sst_syslog
from db_mgt.db_exec import DBExec
from db_mgt.json_storage_manager import JSONStorageManager

class Descriptors(object):
    """Central object for managing descriptors.

    """
    def __init__(self):
        self.db_exec = DBExec()
        self.json_mgr = self.db_exec.create_json_manager()
        self.json_descriptors = JSONStorageManager(self.db_exec)
        self.descriptor = None

    def load_descriptor_from_database(self, name: str) -> Dict[AnyStr, Any]:
        """Get descriptor of specific name from database

        This is often a descriptor that contains substitutions ('S_xxx') internally.
        We call make_json_descriptor on that base to expand to a full descriptor without specified substitutions.

        Args:
            name: str - descriptor name

        Returns:    JSON descriptor

        """
        base_descriptor = self.json_mgr.get_json_from_name(name)
        if base_descriptor:
            return self.json_mgr.make_json_descriptor(base_descriptor)
        else:
            return None

    def get_descriptor_as_string(self, desc) -> str:
        """Returns current descriptor (in this object) as a string suitable for storing in DB.

        Returns: str - JSON dump of descriptor

        """
        res = dumps(desc)
        return res

    def make_single_page_story_descriptor(self, story: str) -> Dict[AnyStr, Any]:
        res = self.json_mgr.make_json_descriptor(self.json_mgr.get_json_from_name('P_SINGLECELLROW'))
        res['ROW']['columns'][0]['cells'][0]['element'] = "S_STORY"
        res['ROW']['columns'][0]['cells'][0]['element_type'] = "STORY"
        res['ROW']['columns'][0]['cells'][0]['is-snippet'] = False
        partial_descriptor = self.json_mgr.make_json_descriptor(res)
        if story.isdigit():
            partial_descriptor['ROW']['columns'][0]['cells'][0]['element']['id'] = story
        else:
            partial_descriptor['ROW']['columns'][0]['cells'][0]['element']['name'] = story
        descriptor = {'PAGE': {'rows': [partial_descriptor]}}
        return descriptor

    def make_single_cell_descriptor(self, element_type: str) -> Dict[AnyStr, Any]:
        """Create a cell descriptor for specific type of element"""
        cell_descriptor = self.desc_mgr.load_descriptor_from_database(element_type)
        cell_subtype = self.json_mgr.load_descriptor_from_database('P_CELL')
        cell_subtype['element'] = cell_descriptor
        cell_subtype['element_type'] = element_type
        return cell_descriptor

    def build_bootstrap_carousel_snippet(self):
        """Create a snippet using bootstrap carousel to display a set of photos.
        """
        desc = self.json_mgr.make_json_descriptor('CAROUSEL')

        self.descriptor = desc

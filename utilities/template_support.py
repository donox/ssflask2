import toml
from collections import OrderedDict
from typing import List, Any, NoReturn
import copy


dict_to_toml_file = None
def set_dict(proc):
    global dict_to_toml_file
    dict_to_toml_file = proc

# These are utilities used in managing JSON templates - especially merging user created templates into larger
# system created templates.

def walk_structure(struct: dict) -> List[Any]:
    """Walk a template returning paths from root to leaf."""
    def walker(curr_node, curr_path: list):
        node_type = type(curr_node)
        if node_type is str:
            return
        elif node_type is list:
            # Each item in the list has exactly 1 dictionary in it - so we find it and recur on that
            for node in curr_node:
                if type(node) is dict:
                    curr_path.append(curr_node)
                    for res in walker(node, curr_path):
                        yield res
                    curr_path.pop()
        elif node_type is dict:
            is_leaf = True
            for key, val in curr_node.items():
                if type(val) in [dict, list]:
                    is_leaf = False
                    break
            if is_leaf:
                curr_path.append(curr_node)
                # Found leaf
                yield curr_path
                curr_path.pop()
            else:
                # Dictionary that contains at least 1 subordinate structure
                for key, val in curr_node.items():
                    if type(val) in [dict, list]:
                        curr_path.append(curr_node)
                        for res in walker(val, curr_path):
                            yield res
                        curr_path.pop()

    path = list()
    for res in walker(struct, path):
        yield res
    foo = 3


def find_branches(json_tree) -> OrderedDict:
    """Create an OrderedDict of branches in a template."""
    branch_list = OrderedDict()
    for branch in walk_structure(json_tree):
        keys = branch[-1].keys()
        name = None
        for candidate in ['node_name', 'id', 'slug', 'name']:
            if candidate in keys:
                name = branch[-1][candidate]
                branch_list[name] = copy.copy(branch)
                break
    if name:
        return branch_list
    else:
        return None


def merge_json_descriptors(child: dict, parent: dict, is_prototype: bool) -> dict:
    """Merge two compatible JSON descriptors into one.
    The assumption here is that both descriptors represent JSON or TOML structures, so
there are no particularly complex types such as objects, tuples, sets, ...

    The parent descriptor has a key ('descriptor') at top level which identifies the structure in
    JSONStorageManager it represents.
    The child descriptor has a key ('parent') at top level which identifies the name of the parent
    JSON in the database.
    """
    try:
        # dict_to_toml_file(parent, '/home/don/Downloads/foo_parent.toml')
        # dict_to_toml_file(child, '/home/don/Downloads/foo_child.toml')
        parent_branches = find_branches(parent)
        if not parent_branches:
            raise ValueError(f'No node name found in parent JSON template')
        child_branches = find_branches(child)
        if not child_branches:
            raise ValueError(f'No node name found in child JSON template')
        if is_prototype:
            pass
        else:
            parent_leaf_names = parent_branches.keys()
            child_leaf_names = child_branches.keys()
            for child_leaf in child_leaf_names:
                if child_leaf in parent_leaf_names:
                    merge_branches(child_branches[child_leaf], parent_branches[child_leaf])
                else:
                    raise NotImplementedError(f'Attempt to add child_leaf {child_leaf} to a parent without such leaf')
    except Exception as e:
        raise ValueError(f'Failure in merge_json_descriptors')


def merge_nodes(child_dict: dict, parent_dict: dict) -> NoReturn:
    if type(child_dict) is dict:
        for key, val in child_dict.items():
            try:
                parent_dict[key] = val
            except Exception as e:
                raise ValueError(f'Fail trying to add value {val} to parent dictionary with key {key}')


def merge_branches(child_branch: list, parent_branch: list) -> NoReturn:
    """Merge data from child into parent branch"""
    if len(child_branch) != len(parent_branch):
        raise NotImplementedError(
            f'Unequal length branches.  Child Length: {len(child_branch)}, Parent Length: {len(parent_branch)}')
    for child, parent in zip(child_branch, parent_branch):
        merge_nodes(child, parent)


def build_descriptors_from_prototypes(child_dict, json_tbl_mgr):
    """Build 'parent' descriptor from child using prototypes."""
    result_template = _build_descriptors_from_prototypes(child_dict, json_tbl_mgr)
    # We assume that there is one dictionary (generally PAGE) and one list (generally rows)
    for key, val in result_template.items():
        if type(val) is dict and key.isupper():
            for key1, val1 in result_template.items():
                if type(val1) is list:
                    result_template[key][key1] = val1
                    break
            break
    return result_template


def _build_descriptors_from_prototypes(child_dict, json_tbl_mgr):
    # Top level entry seems to behave a bit differently - if we can fold into here, we
    # can remove this function.
    if type(child_dict) is not dict:
        raise SystemError(f'Should not call _build_descriptors_from_prototypes with type: {type(child_dict)}')
    else:
        try:
            result_template = dict()
            # if is primary type, add to evolving parent and give parent node same name as child node.
            # if not primary type -  return - end of chain
            # for each list or dict in child, recur adding result to primary node with same key
            for key, val in child_dict.items():
                if key in json_tbl_mgr.get_json_primary_templates():
                    new_obj = json_tbl_mgr.get_json_from_name('P_'+key)
                    for name in ['node_name', 'id', 'slug', 'name']:
                        if name in child_dict:
                            new_obj[name] = child_dict[name]
                            break
                    result_template[key] = new_obj
                else:
                    result_template[key.lower()] = val
            for key, val in child_dict.items():
                if type(val) is list:
                    res_list = list()
                    for elem in val:
                        res_list.append(_build_descriptors_from_prototypes(elem, json_tbl_mgr))
                    result_template[key.lower()] = res_list
                elif type(val) is dict:
                    res_dict = dict()
                    for key1, val1 in val.items():
                        if type(val1) is dict:
                            res_dict[key1] = _build_descriptors_from_prototypes(val1, json_tbl_mgr)
                        elif type(val1) is list:
                            if key1[0:-1] in json_tbl_mgr.get_json_primary_templates():
                                res_list = list()
                                for elem in val1:
                                    res_list.append(_build_descriptors_from_prototypes(elem, json_tbl_mgr))
                                res_dict[key1.lower()] = res_list
                            else:
                                result_template[key1] = val1
                    result_template[key] = res_dict
                else:
                    result_template[key] = val
            return result_template
        except Exception as e:
            raise e

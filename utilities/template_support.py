import toml
from collections import OrderedDict
from typing import List, Any, NoReturn, Dict
import copy
import itertools

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
    Note that this works by side effect, so nothing is returned.  The caller is responsible for making
    any copies needed.
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
                    res = merge_lists(child_branches[child_leaf], parent_branches[child_leaf])
                    parent_branches[child_leaf] = res
                else:
                    raise NotImplementedError(f'Attempt to add child_leaf {child_leaf} to a parent without such leaf')
    except Exception as e:
        raise ValueError(f'Failure in merge_json_descriptors')


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
            parent = dict()
            # if is primary type, add to evolving parent and give parent node same name as child node.
            # if not primary type -  return - end of chain
            # for each list or dict in child, recur adding result to primary node with same key
            for key, val in child_dict.items():
                key1 = key
                if key == 'photo':          # Deal with confusion of photo/picture term
                    key1 = 'PICTURE'
                if key1 in json_tbl_mgr.get_json_primary_templates():
                    new_obj = json_tbl_mgr.get_json_from_name('P_' + key1)
                    for name in ['node_name', 'id', 'slug', 'name']:
                        if name in child_dict:
                            new_obj[name] = child_dict[name]
                            break
                    parent[key] = new_obj
            # result_template holds the parent we are constructing.  Now we go though the child again
            # adding expansions of elements specified in the child that need to be in the parent.
            # There are several cases (key, val) always in child:
            # (1) Key in  parent(new_obj) and val in both is str => parent[key] = val
            # (2) Key not in parent => parent[key] = val
            # (3) Val in child is structure, not in parent  => parent[key] = val
            # (4) Val in child is string, structure in parent => probable error - raise
            # (5) Val in both is structure => several subcases
            for key, val in child_dict.items():
                if key in parent:
                    par_type_is_struct = type(parent[key]) in [dict, list]
                    if type(val) is list and not par_type_is_struct:  # Case (3)
                        res_list = list()
                        for elem in val:
                            res_list.append(_build_descriptors_from_prototypes(elem, json_tbl_mgr))
                        parent[key.lower()] = res_list
                    elif type(val) is dict and not par_type_is_struct:  # Case (3)
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
                                    res_dict[key1.lower()] = val1
                            else:
                                res_dict[key1.lower()] = val1
                        parent[key] = res_dict
                    elif type(val) is dict and type(parent[key]) is dict:
                        parent[key] = merge_dictionaries(val, parent[key])  # Case(5), both dict
                    elif type(val) is list and type(parent[key]) is list:
                        parent[key] = merge_lists(val, parent[key])  # Case(5), both list
                    else:      # Case (1)
                        parent[key] = val
                else:
                    parent[key] = val  # Case (2)
            return parent
        except Exception as e:
            raise e


def merge_structured_nodes(child: [List, Dict], parent: [List, Dict]) -> [List, Dict]:
    # It is an error to try to merge a List and a Dict - both nodes must be of same type
    # Dictionaries are merged by walking the keys with child providing values to the parent where sensible
    # Lists are merged in order (BIG ASSUMPTION) assuming compatible types (BIG ASSUMPTION) recurring to
    # merge structures,  child to parent otherwise.
    if type(child) != type(parent):
        raise ValueError(
            f'Attempt to merge incompatible structures: child is {type(child)} and parent is {type(parent)}')
    if type(child) is dict:
        merge_dictionaries(child, parent)
    else:
        merge_lists(child, parent)


def merge_dictionaries(child: Dict, parent: Dict) -> Dict:
    res = copy.deepcopy(parent)
    for key, val in child.items():
        if key in parent:
            if type(parent) not in [list, dict]:
                res[key] = val
            elif type(val) is dict:
                res[key] = merge_dictionaries(val, parent[key])
            elif type(val) is list:
                res[key] = merge_lists(val, parent[key])
            else:
                res[key] = val
    return res


def merge_lists(child: List, parent: List) -> List:
    res = []
    for c, p in itertools.zip_longest(child, parent):
        if not c:
            res.append(p)
        elif not p:
            res.append(c)
        elif type(c) != type(p):
            raise ValueError(
                f'Attempt to merge incompatible lists: child is {type(child)} and parent is {type(parent)}')
        elif type(c) is list:
            res.append(merge_lists(c, p))
        elif type(c is dict):
            res.append(merge_dictionaries(c, p))
        else:
            res.append(c)
    return res

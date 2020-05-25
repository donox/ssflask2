import os
from db_mgt.db_exec import DBExec
from linkages.graph import Graph, Edge, Node
from linkages.keywords import KeywordEdge, KeywordNode
import json


def manage_graphs_commands(db_exec: DBExec, form):
    """Functions that support the commands in the prototype form."""
    """
     Route: '/sysadmin/manage_graphs' => manage_graph_commands
     Template: manage_graphs.jinja2
     Form: manage_graphs_form.py
     Processor: graph_commands.py
    """
    function_to_execute = form.work_function.data
    template_name = form.template_name.data
    try:
        if function_to_execute == 'gph_load':  # 'Load new graph'
            json_mgr = db_exec.create_json_manager()
            graph_dict = json_mgr.get_json_from_name(template_name)
            if not graph_dict:
                form.errors['template_name'] = [f'Template named {template_name} was not recognized.']
                return False
            graph_dict = graph_dict['graph']
            graph = Graph(db_exec)
            graph.name = graph_dict['name']
            graph.purpose = graph_dict['purpose']
            nodes = graph_dict['nodes']
            edges = graph_dict['edges']
            for node in nodes:
                node_type = node['node_name']
                if node_type == 'KEYWORD_NODE':
                    new_node = KeywordNode(None, None, shell=True)
                elif node_type == 'KEYWORD_FACET' or node_type == 'KEYWORD_facet':
                    new_node = KeywordFacetNode(None, None, None, shell=True)
                else:
                    raise ValueError(f'Unrecognized node_type: {node_type}')
                new_node.deserialize(graph, json.dumps(node))
            for edge in edges:
                new_edge = Edge(None, None, None, shell=True)
                new_edge.deserialize(graph, edge)
            return True


        # elif function_to_execute == 'usr_add':
        #     try:
        #         do_stuff()
        #         return True           #if success
        # elif function_to_execute == 'usr_del':
        #     user_id = user_mgr.get_user_id_from_name(user_name)
        #     if not user_id:
        #         form.errors['No Such User'] = [f'User: {user_name} not found.']
        #         return False
        #     user_mgr.delete_user_by_id(user_id)
        #     return True
        # elif function_to_execute == 'usr_mod':
        #     user_id = user_mgr.get_user_id_from_name(user_name)
        #     if not user_id:
        #         form.errors['No Such User'] = [f'User: {user_name} not found.']
        #         return False
        #     user = user_mgr.get_user_by_id(user_id)
        #     if user_email:
        #         try:
        #             valid = validate_email(user_email)
        #             user.email = valid.email
        #         except EmailNotValidError as e:
        #             form.errors['Invalid Email'] = [f'Invalid email.  Validation returned {e.args}']
        #             return False
        #     user_name_parts = user_name.split()
        #     user.last_name = user_name_parts[-1]
        #     user.first_name = ' '.join(user_name_parts[0:-1])
        #     if user_password:
        #         pm = PasswordManager(app)
        #         user.password = pm.hash_password(user_password)
        #     user_mgr.update_user(user)
        #     return True

        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        form.errors['work_function'] = ['manage groups - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False

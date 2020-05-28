from db_mgt.db_exec import DBExec
from linkages.persistence import GraphPersistence
from flask import app
from abc import ABC, abstractmethod


class AbstractMakeGraph(ABC):
    """Abstract Constructor for a Graph.

    A graph is intended to be a minimalist object that understands the performance of graph
    related operations (find neighbor, spanning tree, ...) and can be persisted through the
    injection of methods to handle storage in some appropriate form.  It can also be adapted
    to a specific purpose through the injection of appropriate methods (a "persona") that are
    added to the graph, each node, and each edge to create the appropriate behavior.


    """

    def __init__(self):
        self.db_exec = DBExec()
        self.persona = {'persist_graph': self.persist_graph,
                        'persist_node': self.persist_node_base,
                        'persist_edge': self.persist_edge_base,
                        'node_types': self.node_types,
                        'node_persona': self.node_persona,
                        'edge_types': self.edge_types,
                        'edge_persona': self.edge_persona,
                        'install_methods': self.install_methods,
                        }

        self.graph = Graph(self.db_exec, self.persona)

    @abstractmethod
    def persist_graph(self):
        pass

    @abstractmethod
    def persist_node_base(self):
        pass

    @abstractmethod
    def persist_edge_base(self):
        pass

    @property
    @abstractmethod
    def node_types(self):
        return []

    @property
    @abstractmethod
    def node_persona(self):
        return {'install_methods': self.install_methods,
                'persist_node': self.persist_node,
                'node_init': self.node_init
                }

    @property
    @abstractmethod
    def edge_types(self):
        return []

    @property
    @abstractmethod
    def edge_persona(self):
        return {'install_methods': self.install_methods,
                'persist_edge': self.persist_edge,
                'edge_init': self.edge_init
                }

    @abstractmethod
    def persist_node(self):
        pass

    @abstractmethod
    def node_init(self, node_type, persona, *args, **kwargs):
        pass

    @abstractmethod
    def persist_edge(self):
        pass

    @abstractmethod
    def edge_init(self, edge_type, persona, node_1, node_2, directed, *args, **kwargs):
        pass

    def install_methods(self, methods_list, install_object):
        """Install injected methods in client object."""
        for method in methods_list:
            if method not in self.persona:
                raise ValueError(f'Method {method}, requested, but not available to install')
        for method, handler in self.persona.items():
            setattr(install_object, method, handler)


class Graph(object):
    """Undirected graph to support building/managing relationships."""

    def __init__(self, db_exec: DBExec, persona):
        # EXAMPLE PERSONA for a graph.  Nodes and edges within the graph type each
        # have a persona that specifies how that object should behave.
        # persona['node_makers'] = {'KeywordNode': self.make_keyword_node,
        #                           'KStoryNode': self.make_story_node,
        #                           'PhotoNode': self.make_photo_node}
        self.id = 0
        self.persona = persona  # dependencies that enable graph to be a specific type
        self.name = None
        self.purpose = None
        self.db_exec = db_exec
        self.required_attributes = ['persist_graph', 'persist_node', 'persist_edge', 'node_types', 'node_persona',
                                    'edge_types', 'edge_persona']
        self.nodes = {}
        self.user_node_names = {}
        self.edges = {}
        self.user_edge_names = {}
        persona['install_methods'](self.required_attributes, self)

    def add_node(self, node_type, node_name, *args, **kwargs):
        """Add a new node.
       """
        if node_type not in self.node_types:
            raise ValueError(f'Unrecognized node type: {node_type}')
        node = Node(self, node_type, node_name, self.node_persona, *args, **kwargs)
        self.nodes[node.id] = node  # initialized by the outside caller.
        self.user_node_names[node_name] = node.id
        return node

    def add_edge(self, edge_type, edge_name, node_1, node_2, *args, **kwargs):
        """Add a new edge.

        Args:
            edge: edge_object that was added to graph

        Returns:
"""
        if edge_type not in self.edge_types:
            raise ValueError(f'Unrecognized node type: {edge_type}')
        edge = Edge(self, edge_type, edge_name, self.edge_persona, node_1, node_2, *args, **kwargs)
        self.edges[edge.id] = edge  # initialized by the outside caller.
        self.user_edge_names[edge_name] = edge.id
        return edge

    def get_id(self, element_type, element_name):
        self.id += 1
        if element_type == 'node':
            self.user_node_names[element_name] = self.id
        elif element_type == 'edge':
            self.user_edge_names[element_name] = self.id
        else:
            raise SystemError(f'Invalid element type: {element_type}')
        return self.id

    def get_node(self, node_id):
        if type(node_id) is int:
            if node_id in self.nodes:
                return self.nodes[node_id]
            else:
                return None
        else:
            if node_id in self.user_node_names:
                return self.get_node(self.user_node_names[node_id])
            else:
                return None

    def get_edge(self, edge_id):
        if type(edge_id) is int:
            if edge_id in self.edges:
                return self.edges[edge_id]
            else:
                return None
        else:
            if edge_id in self.user_edge_names:
                return self.get_edge(self.user_edge_names[edge_id])
            else:
                return None


class Node(object):
    """Prototype Node to carry graph knowledge.
    """

    def __init__(self, graph, node_type, node_name, persona, *args, **kwargs):
        self.graph = graph  # graph of which this node is a part
        self.node = None  # node personality object
        self.id = graph.get_id('node', node_name)
        self.name = node_name
        self.node_type = node_type
        self.required_attributes = ['persist_node']
        self.node_init(node_type, node_name, persona, *args, **kwargs)

    def node_init(self, node_type, node_name, persona, *args, **kwargs):
        node_maker = persona['node_makers'][node_type]
        self.node = node_maker(node_name, *args, **kwargs)
        self.node.base_node = self

    def get_id(self):
        return self.id

    def get_name(self):
        return self.name

    def restore_data(self, graph, node_id):
        self.graph = graph
        self.id = node_id

    def deserialize(self, graph: Graph, serial_dict: dict):
        self.graph = graph
        self.id = serial_dict['id']


class Edge(object):
    """Prototype edge to carry graph knowledge.
    """

    def __init__(self, graph, edge_type, edge_name, persona, node_1, node_2, *args, directed=False,
                 **kwargs):
        self.graph = graph  # graph of which this edge is a part
        self.edge = None
        self.id = graph.get_id('edge', edge_name)
        self.name = edge_name
        self.node_1 = node_1
        self.node_2 = node_2
        self.directed = directed
        self.edge_type = edge_type
        self.required_attributes = ['persist_edge']
        self.edge_init(edge_type, edge_name, persona, node_1, node_2, *args, directed=False, **kwargs)

    def edge_init(self, edge_type, edge_name, persona, node_1_id, node_2_id,  *args, directed=False, **kwargs):
        node_1 = self.graph.get_node(node_1_id)
        node_2 = self.graph.get_node(node_2_id)
        self.edge = persona['edge_makers'][edge_type](self, node_1, node_2, *args, directed=False, **kwargs)
        self.name = edge_name

    def get_id(self):
        return self.id

    def get_name(self):
        return self.name

    def deserialize(self, graph: Graph, serial_dict: dict):
        self.graph = graph
        self.id = serial_dict['id']
        self.node_1 = graph.get_node(serial_dict['start_node'])
        self.node_2 = graph.get_node(serial_dict['end_node'])
        self.directed = serial_dict['directed']

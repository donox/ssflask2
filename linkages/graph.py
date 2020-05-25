from db_mgt.db_exec import DBExec
from linkages.persistence import GraphPersistence
from flask import app
from abc import ABC, abstractmethod

class AbstractMakeGraph(ABC):
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
        self.id = 0
        self.persona = persona  # dependencies that enable graph to be a specific type
        self.name = None
        self.purpose = None
        self.db_exec = db_exec
        self.required_attributes = ['persist_graph', 'persist_node', 'persist_edge', 'node_types', 'node_persona',
                                 'edge_types', 'edge_persona']
        self.nodes = dict()
        self.edges = dict()
        persona['install_methods'](self.required_attributes, self)

    def add_node(self, node_type):
        """Add a new node.
       """
        if node_type not in self.node_types:
            raise ValueError(f'Unrecognized node type: {node_type}')
        node = Node(self, node_type, self.node_persona)
        self.nodes[node.id] = node  # initialized by the outside caller.
        return node

    def add_edge(self, edge_type):
        """Add a new edge.

        Args:
            edge: edge_object that was added to graph

        Returns:
"""
        if edge_type not in self.edge_types:
            raise ValueError(f'Unrecognized node type: {edge_type}')
        edge = Edge(self, self.edge_persona)
        self.nodes[edge.id] = edge  # initialized by the outside caller.
        return edge

    def get_id(self):
        self.id += 1
        return self.id

    def get_node(self, node_id):
        if node_id in self.nodes:
            return self.nodes[node_id]
        else:
            return None

    def get_edge(self, edge_id):
        if edge_id in self.edges:
            return self.edges[edge_id]
        else:
            return None


class Node(object):
    """Prototype Node to carry graph knowledge.
    """

    def __init__(self, graph, node_type, persona):
        self.graph = graph  # graph of which this node is a part
        self.id = graph.get_id()
        self.node_type = node_type
        self.required_attributes = ['persist_node', 'node_init']
        persona['install_methods'](self.required_attributes, self)
        self.node_init(node_type, persona)

    def get_name(self):
        return self.id

    def restore_data(self, graph, node_id):
        self.graph = graph
        self.id = node_id

    def deserialize(self, graph: Graph, serial_dict: dict):
        self.graph = graph
        self.id = serial_dict['id']


class Edge(object):
    """Prototype edge to carry graph knowledge.
    """

    def __init__(self, graph, edge_type, persona, node_1, node_2, directed=False):
        self.graph = graph  # graph of which this edge is a part
        self.id = graph.get_id()
        self.node_1 = node_1
        self.node_2 = node_2
        self.directed = directed
        self.graph.add_edge(self)
        self.edge_type = edge_type
        self.required_attributes = ['persist_edge', 'edge_type', 'edge_init']
        persona['install_methods'](self.required_attributes, self)
        self.edge_init(edge_type, persona, node_1, node_2, directed)

    def get_name(self):
        return self.id

    def deserialize(self, graph: Graph, serial_dict: dict):
        self.graph = graph
        self.id = serial_dict['id']
        self.node_1 = graph.get_node(serial_dict['start_node'])
        self.node_2 = graph.get_node(serial_dict['end_node'])
        self.directed = serial_dict['directed']

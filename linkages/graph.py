from db_mgt.db_exec import DBExec

class Graph(object):
    """Undirected graph to support building/managing relationships."""
    def __init__(self, db_exec: DBExec):
        self.id = 0
        self.name = None
        self.purpose = None
        self.db_exec = db_exec
        self.nodes = dict()
        self.edges = dict()

    def add_node(self, node):
        """Add a new node.
       """
        self.nodes[node.id] = node
        return node

    def add_edge(self, edge):
        """Add a new edge.

        Args:
            edge: edge_object that was added to graph

        Returns:
"""
        self.edges[edge.id] = edge
        return

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
    def __init__(self, graph, shell=False):
        if shell:           # This creates an empty Node that can be filled by deserialize.
            return
        self.graph = graph  # graph of which this node is a part
        self.id = graph.get_id()
        self.graph.add_node(self)

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

    def __init__(self, graph, node_1, node_2, directed=False, shell=False):
        if shell:
            return
        self.graph = graph  # graph of which this edge is a part
        self.id = graph.get_id()
        self.node_1 = node_1
        self.node_2 = node_2
        self.directed = directed
        self.graph.add_edge(self)

    def get_name(self):
        return self.id

    def deserialize(self, graph: Graph, serial_dict: dict):
        self.graph = graph
        self.id = serial_dict['id']
        self.node_1 = graph.get_node(serial_dict['start'])
        self.node_2 = graph.get_node(serial_dict['end'])
        self.directed = serial_dict['directed']



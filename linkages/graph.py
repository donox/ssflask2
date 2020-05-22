

class Graph(object):
    """Undirected graph to support building/managing relationships."""
    def __init__(self):
        self.id = 0
        self.nodes = dict()
        self.edges = dict()

    def _add_node(self, node):
        """Add a new node.
       """
        self.nodes[node.node_name] = node
        return node

    def _add_edge(self, edge):
        """Add a new edge.

        Args:
            edge: edge_object that was added to graph

        Returns:
"""
        self.edges[edge.edge_name] = edge
        return

    def get_id(self):
        self.id += 1
        return self.id


class Node(object):
    """Prototype Node to carry graph knowledge.
    """
    def __init__(self, graph):
        self.graph = graph  # graph of which this node is a part
        self.id = graph.get_id()

    def get_name(self):
        return self.id

    def restore_data(self, graph, node_id):
        self.graph = graph
        self.id = node_id


class Edge(object):
    """Prototype edge to carry graph knowledge.
    """

    def __init__(self, graph, node_1, node_2, directed=False):
        self.graph = graph  # graph of which this edge is a part
        self.id = graph.get_id()
        self.node_1 = node_1
        self.node_2 = node_2
        self.directed = directed

    def get_name(self):
        return self.id



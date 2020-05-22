from test_base import BaseTestCase
from linkages.graph import Graph, Edge, Node
from flask import url_for
from random import randint


class GraphTests(BaseTestCase):

    def setUp(self):
        self.graph = Graph()
        self.nodes = []
        self.edges = []
        for i in range(10):
            node = Node(self.graph)
            self.nodes.append(node)
        for i in range(20):
            j = randint(0, 9)
            k = randint(0, 9)
            edge = Edge(self.graph, self.nodes[j],  self.nodes[k], directed=True)
            self.edges.append(edge)

    def test_graph(self):
        all_items = set()
        for node in self.nodes:
            all_items.add(node.id)
        for edge in self.edges:
            all_items.add(edge.id)
        self.assertEqual(len(all_items), 30, "Didn't find them all")
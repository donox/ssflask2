from test_base import BaseTestCase
from linkages.graph import Graph, Edge, Node
from linkages.keywords import KeywordNode, KeywordElementNode, KeywordEdge
from flask import url_for
from random import randint
from db_mgt.db_exec import DBExec


class GraphTests(BaseTestCase):

    def setUp(self):
        self.db_exec = DBExec()
        self.graph = Graph(self.db_exec)
        self.nodes = []
        self.edges = []
        for i in range(10):
            node = Node(self.graph)
            self.nodes.append(node)
        for i in range(20):
            j = randint(0, 9)
            k = randint(0, 9)
            edge = Edge(self.graph, self.nodes[j], self.nodes[k], directed=True)
            self.edges.append(edge)

    def test_graph(self):
        all_items = set()
        for node in self.nodes:
            all_items.add(node.id)
        for edge in self.edges:
            all_items.add(edge.id)
        self.assertEqual(len(all_items), 30, "Didn't find them all")

    def test_make_keyword_node(self):
        kw_node = KeywordNode(self.graph, 'foobah')
        kw_node.synonyms = ['farn', 'durn', 'blurd']
        json_res = kw_node.serialize()
        self.assertEqual('{"id": 31, "keyword": "foobah", "synonyms": ["farn", "durn", "blurd"]}', json_res,
                         'Wrong Result')

    def test_deserialize_keyword_node(self):
        graph = Graph(self.db_exec)
        json_str = '{"id": 31, "keyword": "foobah", "synonyms": ["farn", "durn", "blurd"]}'
        kw_node = KeywordNode(None, None, shell=True)
        kw_node.deserialize(graph, json_str)
        res = kw_node.serialize()
        self.assertEqual(json_str, res, 'Failed to deserialize properly')

    def test_make_keyword_element_node(self):
        page_mgr = self.db_exec.create_page_manager()
        pg = page_mgr.get_page_if_exists(44907, None)
        kwe_node = KeywordElementNode(self.graph, 'page', pg)
        json_res = kwe_node.serialize()
        self.assertEqual('{"id": 31, "element_id": 44907, "element_type": "page"}', json_res,
                         'Wrong Result')

    def test_deserialize_keyword_element_node(self):
        graph = Graph(self.db_exec)
        json_str = '{"id": 31, "element_id": 44907, "element_type": "page"}'
        kwe_node = KeywordElementNode(None, None, None, shell=True)
        kwe_node.deserialize(graph, json_str)
        res = kwe_node.serialize()
        self.assertEqual(json_str, res, 'Failed to deserialize correctly')

    def test_make_keyword_edge_node(self):
        kw_node = KeywordNode(self.graph, 'foobah')
        page_mgr = self.db_exec.create_page_manager()
        pg = page_mgr.get_page_if_exists(44907, None)
        kwe_node = KeywordElementNode(self.graph, 'page', pg)
        kw_edge = KeywordEdge(self.graph, kw_node, kwe_node)
        json_res = kw_edge.serialize()
        self.assertEqual('{"id": 33, "start_node": 31, "end_node": 32, "directed": true}', json_res,
                         'Wrong Result')

    def test_deserialize_edge_node(self):
        graph = Graph(self.db_exec)
        json_str = '{"id": 32, "element_id": 44907, "element_type": "page"}'
        kwe_node = KeywordElementNode(None, None, None, shell=True)
        kwe_node.deserialize(graph, json_str)
        json_str = '{"id": 31, "keyword": "foobah", "synonyms": ["farn", "durn", "blurd"]}'
        kw_node = KeywordNode(None, None, shell=True)
        kw_node.deserialize(graph, json_str)
        json_str = '{"id": 33, "start_node": 31, "end_node": 32, "directed": true}'
        edge_node = KeywordEdge(None, None, None, shell=True)
        edge_node.deserialize(graph, json_str)
        res = edge_node.serialize()
        self.assertEqual(res, json_str, 'Failed to deserialize Edge Node')

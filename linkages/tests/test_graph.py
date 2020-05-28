from test_base import BaseTestCase
from linkages.graph import Graph, Edge, Node, AbstractMakeGraph
from linkages.keywords import KeywordNode, KeywordEdge, MakeKeywordStoryPhotoGraph

from flask import url_for
from random import randint
from db_mgt.db_exec import DBExec


class GraphTests(BaseTestCase):

    def setUp(self):
        self.db_exec = DBExec()
        # self.graph = Graph(self.db_exec)
        # self.nodes = []
        # self.edges = []
        # for i in range(10):
        #     node = Node(self.graph)
        #     self.nodes.append(node)
        # for i in range(20):
        #     j = randint(0, 9)
        #     k = randint(0, 9)
        #     edge = Edge(self.graph, self.nodes[j], self.nodes[k], directed=True)
        #     self.edges.append(edge)

    def test_create_graph(self):
        test_graph = MakeKeywordStoryPhotoGraph()
        full_graph = Graph(self.db_exec, test_graph.persona)
        full_graph.add_node('KeywordNode', 'kn-1', 'elephant', synonyms=['mouse', 'trunk'])
        full_graph.add_node('StoryNode', 'ks-1', 'book-buddies')
        full_graph.add_node('PhotoNode', 'kp-1', 10044)
        full_graph.add_edge('KeywordEdge', 'ke-1', 'kn-1', 'kp-1', directed=True)
        self.assertEqual(3, len(full_graph.nodes), "Not produce all nodes")

    def test_make_serialize_elements(self):
        test_graph = MakeKeywordStoryPhotoGraph()
        full_graph = Graph(self.db_exec, test_graph.persona)
        full_graph.add_node('KeywordNode', 'kn-1', 'elephant', synonyms=['mouse', 'trunk'])
        res = full_graph.nodes[1].node.serialize()
        self.assertEqual(res, '{"id": "kn-1", "keyword": "kn-1", "synonyms": ["mouse", "trunk"]}', 'Bad serialization - node 1')
        full_graph.add_node('StoryNode', 'ks-1', 'book-buddies')
        res = full_graph.nodes[2].node.serialize()
        full_graph.add_node('PhotoNode', 'kp-1', 10044)
        res = full_graph.nodes[3].node.serialize()
        full_graph.add_edge('KeywordEdge', 'ke-1', 'kn-1', 'kp-1', directed=True)
        res = full_graph.edges[4].edge.serialize()
        self.assertEqual(res, '{"id": "ke-1", "start_node": "kn-1", "end_node": "kp-1"}', 'Bad serialization - edge')


    def test_make_deserialize_elements(self):
        test_graph = MakeKeywordStoryPhotoGraph()
        full_graph = Graph(self.db_exec, test_graph.persona)
        full_graph.add_node('KeywordNode', 'kn-1', 'elephant', synonyms=['mouse', 'trunk'])
        res = full_graph.nodes[1].node.serialize()
        new_node = KeywordNode(full_graph.nodes[1].node,None)
        res2 = new_node.deserialize(full_graph, res)
        full_graph.add_node('StoryNode', 'ks-1', 'book-buddies')
        res = full_graph.nodes[2].node.serialize()
        res2 = full_graph.nodes[2].node.deserialize()
        full_graph.add_node('PhotoNode', 'kp-1', 10044)
        res = full_graph.nodes[3].node.serialize()
        res2 = full_graph.nodes[3].node.deserialize()
        full_graph.add_edge('KeywordEdge', 'ke-1', 'kn-1', 'kp-1', directed=True)
        res = full_graph.edges[4].edge.serialize()

        res2 = full_graph.nodes[4].node.deserialize()
        self.assertEqual(res, '{"id": "ke-1", "start_node": "kn-1", "end_node": "kp-1"}', 'Bad serialization - edge')

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

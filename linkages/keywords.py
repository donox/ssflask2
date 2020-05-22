from .graph import Graph, Node, Edge
import json
from db_mgt.page_tables import Page
from db_mgt.sst_photo_tables import SSTPhoto


class KeywordNode(Node):

    def __init__(self, graph, keyword, shell=False):
        if shell:
            return
        super().__init__(graph)
        self.keyword = keyword
        self.synonyms = []

    def get_keyword(self):
        return self.keyword

    def serialize(self):
        result = {'id': super().get_name(),
                  'keyword': self.keyword,
                  'synonyms': self.synonyms}
        return json.dumps(result)

    def deserialize(self, graph, serial_str):
        json_dict = json.loads(serial_str)
        super().restore_data(graph, json_dict['id'])
        graph.add_node(self)
        self.keyword = json_dict['keyword']
        self.synonyms = json_dict['synonyms']


class KeywordElementNode(Node):
    supported_element_types = ['page', 'pnoto']
    def __init__(self, graph, element_type, element, shell=False):
        if shell:
            return
        super().__init__(graph)
        self.element = element
        if element_type in KeywordElementNode.supported_element_types:
            self.element_type = element_type
        else:
            raise ValueError(f'Unsupported Element Type: {element_type}')

    def get_element(self):
        return self.element_type, self.element_type

    def serialize(self):
        result = {'id': super().get_name(),
                  'element_id': self.element.id,
                  'element_type': self.element_type}
        return json.dumps(result)

    def deserialize(self, graph, serial_str):
        json_dict = json.loads(serial_str)
        super().restore_data(graph, json_dict['id'])
        graph.add_node(self)
        self.element_type = json_dict['element_type']
        if self.element_type == 'page':
            page_mgr = graph.db_exec.create_page_manager()
            self.element = page_mgr.get_page_if_exists(json_dict['element_id'], None)
        elif self.element_type == 'photo':
            photo_mgr = graph.db_exec.create_sst_photo_manager()
            self.element = photo_mgr.get_photo_by_id_if_exists(json_dict['element_id'], None)
        else:
            raise ValueError(f'Unrecognized node type: {self.element_type}')


class KeywordEdge(Edge):
    def __init__(self, graph, keyword_node, element_node, directed=True, shell=False):
        if shell:
            return
        super().__init__(graph, keyword_node, element_node, directed=directed)
        self.keyword_node = keyword_node
        self.element_node = element_node

    def serialize(self):
        result = {'id': self.get_name(),
                  'start_node': self.node_1.id,
                  'end_node': self.node_2.id,
                  'directed': self.directed}
        return json.dumps(result)

    def deserialize(self, graph, serial_str):
        json_dict = json.loads(serial_str)
        super().deserialize(graph, json_dict)
        self.keyword_node = graph.get_node(json_dict['start_node'])
        self.element_node = graph.get_node(json_dict['end_node'])
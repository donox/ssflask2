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


class KeywordFacetNode(Node):
    supported_facet_types = ['page', 'sst_photo']
    def __init__(self, graph, facet_type, facet, shell=False):
        if shell:
            return
        super().__init__(graph)
        self.facet = facet
        if facet_type in KeywordFacetNode.supported_facet_types:
            self.facet_type = facet_type
        else:
            raise ValueError(f'Unsupported Facet Type: {facet_type}')

    def get_facet(self):
        return self.facet_type, self.facet_type

    def serialize(self):
        result = {'id': super().get_name(),
                  'facet_id': self.facet.id,
                  'facet_type': self.facet_type}
        return json.dumps(result)

    def deserialize(self, graph, serial_str):
        json_dict = json.loads(serial_str)
        super().restore_data(graph, json_dict['id'])
        graph.add_node(self)
        self.facet_type = json_dict['facet_type']
        if self.facet_type == 'page':
            page_mgr = graph.db_exec.create_page_manager()
            page_id = json_dict['facet']
            if page_id.isdigit():
                self.facet = page_mgr.get_page_if_exists(page_id, None)
            else:
                self.facet = page_mgr.get_page_if_exists(None, page_id)
        elif self.facet_type == 'sst_photo':
            photo_mgr = graph.db_exec.create_sst_photo_manager()
            self.facet = photo_mgr.get_photo_by_id_if_exists(json_dict['facet'])
        else:
            raise ValueError(f'Unrecognized node type: {self.facet_type}')


class KeywordEdge(Edge):
    def __init__(self, graph, keyword_node, facet_node, directed=True, shell=False):
        if shell:
            return
        super().__init__(graph, keyword_node, facet_node, directed=directed)
        self.keyword_node = keyword_node
        self.facet_node = facet_node

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
        self.facet_node = graph.get_node(json_dict['end_node'])

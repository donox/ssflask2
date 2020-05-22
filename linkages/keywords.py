from .graph import Graph, Node, Edge
import json


class KeywordNode(Node):

    def __init__(self, graph, keyword):
        super.__init__(graph)
        self.keyword = keyword
        self.synonyms = []

    def get_keyword(self):
        return self.keyword

    def serialize(self):
        result = {'id': super.get_name(),
                  'keyword': self.keyword,
                  'synonyms': self.synonyms}
        return json.dumps(result)

    def deserialize(self, graph, serial_str):
        json_dict = json.loads(serial_str)
        super.restore_data(graph, json_dict['id'])
        self.keyword = json_dict['keyword']
        self.synonyms = json_dict['synonyms']


class KeywordElementNode(Node):
    def __init__(self, graph, element_type, element):
        super.__init__(graph)
        self.element = element
        self.element_type = element_type

    def get_element(self):
        return self.element_type, self.element_type

    def serialize(self):
        result = {'id': super.get_name(),
                  'element': self.element.serialize(),
                  'element_type': self.element_type}
        return json.dumps(result)

    def deserialize(self, graph, serial_str):
        json_dict = json.loads(serial_str)
        super.restore_data(graph, json_dict['id'])
        self.element = json_dict['element']    # CAN"T DO THIS - Nothing to call
        self.element_type = json_dict['element_type']


class KeywordEdge(Edge):
    def __init__(self, graph, keyword_node, element_node):
        super.__init__(graph, keyword_node, element_node, directed=True)
        self.keyword_node = keyword_node
        self.element_node = element_node

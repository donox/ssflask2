from .graph import Graph, Node, Edge, AbstractMakeGraph
import json
from db_mgt.db_exec import DBExec
from db_mgt.page_tables import Page
from db_mgt.sst_photo_tables import SSTPhoto


class MakeKeywordStoryPhotoGraph(AbstractMakeGraph):
    def __init__(self):
        super().__init__()

    def persist_graph(self):
        pass

    def persist_node_base(self):
        pass

    def persist_edge_base(self):
        pass

    @property
    def node_types(self):
        return ['KeywordNode', 'StoryNode', 'PhotoNode']

    @property
    def node_persona(self):
        persona = super().node_persona
        persona['node_makers'] = {'KeywordNode': self.make_keyword_node,
                                  'StoryNode': self.make_story_node,
                                  'PhotoNode': self.make_photo_node}
        return persona

    @property
    def edge_types(self):
        return ['KeywordEdge']

    @property
    def edge_persona(self):
        persona = super().edge_persona
        persona['edge_makers'] = {'KeywordEdge': self.make_keyword_story_photo_edge}
        return persona

    def persist_node(self):
        pass

    def node_init(self, node_type, persona):
        pass

    def persist_edge(self):
        pass

    def edge_init(self, edge_type, persona, node_1, node_2, directed):
        pass

    def make_keyword_node(self, keyword, *args, **kwargs):
        node = KeywordNode(self, keyword, *args, **kwargs)
        return node

    def make_story_node(self,  story, *args, **kwargs):
        node = StoryNode(self,  story, *args, **kwargs)
        return node

    def make_photo_node(self,  photo, *args, **kwargs):
        node = PhotoNode(self, photo, *args, **kwargs)
        return node

    def make_keyword_story_photo_edge(self, base_edge, keyword_node, node, *args, **kwargs):
        edge = KeywordEdge(base_edge, keyword_node, node, *args, **kwargs)
        return edge


class KeywordNode(object):

    def __init__(self, base_node,  keyword, *args, **kwargs):
        self.base_node = base_node
        self.keyword = keyword
        self.node_type = 'keyword'
        if 'synonyms' in kwargs:
            self.synonyms = kwargs['synonyms']

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


class StoryNode(object):

    def __init__(self, base_node, story, *args, **kwargs):
        self.base_node = base_node
        self.story = story          # id or slug of story
        self.node_type = 'story'
        self.page = None

    def serialize(self):
        result = {'id': super().get_name(),
                  'node_type': 'story',
                  }
        return json.dumps(result)

    def deserialize(self, graph, serial_str):
        json_dict = json.loads(serial_str)
        self.graph = graph
        page_mgr = graph.db_exec.create_page_manager()
        page_id = json_dict['story']
        if page_id.isdigit():
            self.page = page_mgr.get_page_if_exists(page_id, None)
        else:
            self.page = page_mgr.get_page_if_exists(None, page_id)


class PhotoNode(object):

    def __init__(self, base_node, photo, *args, **kwargs):
        self.base_node = base_node
        self.photo = photo          # id or slug of photo
        self.node_type = 'photo'

    def serialize(self):
        result = {'id': super().get_name(),
                  'node_type': 'photo',
                  }
        return json.dumps(result)

    def deserialize(self, graph, serial_str):
        json_dict = json.loads(serial_str)
        self.graph = graph
        photo_mgr = graph.db_exec.create_sst_photo_manager()
        photo_id = json_dict['story']
        if photo_id.isdigit():
            self.page = photo_mgr.get_page_if_exists(photo_id, None)            # Bad method????
        else:
            self.page = photo_mgr.get_page_if_exists(None, photo_id)


class KeywordEdge(object):
    def __init__(self, base_edge, keyword_node, node, *args, **kwargs):
        self.base_edge = base_edge      # associated graph edge
        self.keyword_node = keyword_node
        self.target_node_type = node.node_type

    def serialize(self):
        result = {'id': self.get_name(),
                  'start_node': self.node_1.id,
                  'end_node': self.node_2.id,
                  }
        return json.dumps(result)

    def deserialize(self, graph, serial_str):
        json_dict = json.loads(serial_str)
        self.keyword_node = graph.get_node(json_dict['start_node'])
        self.photo_node = graph.get_node(json_dict['end_node'])





class GraphPersistence(object):
    def __init__(self, app):
        self.app = app

    def get_persistence_methods(self):
        return {'persist_graph': self.persist_graph,
                'persist_node': self.persist_node,
                'persist_edge': self.persist_edge}

    def persist_graph(self):
        pass

    def persist_node(self):
        pass

    def persist_edge(self):
        pass

class JSONStorageManager(object):
    # Basic Structure
    # Names are prepended with P_ to indicate a prototype
    # Names are prepended with S_ to indicate that the corresponding DB entry (with a 'P_' substituted
    #      for the 'S_') can be substituted and expanded.
    # Names prepended with N_ are used as is without further processing.
    # Names that are all cap are assumed to be of type prototype (no user names have all caps)
    # All prototypes are in the form of a list with the first element of the list being the name (remove 'P_' if there)
    #     and the remainder are processed to form a dictionary/context.  This implies that 'str' entries that are not
    #     expanded are names whose value will be 'None' (json 'null').  Lists are in Prototype form and dictionaries
    #     are merged with the parent dictionary.
    descriptor_page_layout = {"PAGE": None, "node_name": "PAGE", "name": None, "rows": []}
    descriptor_row_layout = {"ROW": None, "node_name": "ROW", "columns": []}
    descriptor_column_layout = {"COLUMN": None, "node_name": "COLUMN", "cells": [], "column_width": None}
    descriptor_cell_layout = {"CELL": None, "node_name": "CELL", "element_type": None, "element": None,
                              "is_snippet": None,
                              "width": None, "height": None, "styles": None, "classes": None}
    descriptor_graph_fields = {"GRAPH": None, "name": "GRAPH", "id": None, "name": None, "purpose": None, "nodes": [],
                               "edges": []}
    descriptor_graph_node_fields = {"NODE": None, "node_name": "NODE", "id": None, "facet": {}}
    descriptor_graph_edge_fields = {"EDGE": None, "node_name": "EDGE", "id": None, "directed": None, "start": None,
                                    "end": None}

    descriptor_button_fields = {"BUTTON": None, "node_name": "BUTTON", "id": None, "button_type": None, "target": None,
                                "text_content": None}

    # Content Types
    descriptor_picture_fields = {"PICTURE": None, "node_name": "PICTURE", "id": None, "url": None, "title": None,
                                 "caption": None,
                                 "width": None, "height": None, "alignment": None, "alt_text": None,
                                 "css_style": None, "css_class": None, "title_class": None,
                                 "caption_class": None, "image_class": None}
    descriptor_slideshow_fields = {"SLIDESHOW": None, "node_name": "SLIDESHOW", "title": None, "title_class": None,
                                   "position": None,
                                   "width": None, "height": None, "rotation": None,
                                   "frame_title": None, "pictures": []}
    descriptor_story_fields = {"STORY": None, "node_name": "STORY", "id": None, "title": None, "name": None,
                               "author": None,
                               "date": None, "content": None, "snippet": "S_STORY_SNIPPET"}
    descriptor_index_fields = {"INDEX_LINKS": None, "node_name": "INDEX_LINKS", "title:": None, "title_class": None,
                               "buttons": ["S_BUTTON", "S_BUTTON", "S_BUTTON", "S_BUTTON"]}
    descriptor_keyword_node_fields = {"KEYWORD_NODE": None, "node_name": "KEYWORD_NODE", "graph": "S_NODE", "keyword": None, "synonyms": []}
    descriptor_keyword_facet_node_fields = {"KEYWORD_FACET": None, "node_name": "KEYWORD_FACET", "graph": "S_NODE",
                                      "facet_type": None, "facet": {}}

    # Snippets
    descriptor_story_snippet_fields = {"STORY_SNIPPET": None, "node_name": "STORY_SNIPPET", "id": None, "title": None,
                                       "name": None, "author": None,
                                       "date": None, "snippet": None, "photo": "S_PICTURE",
                                       "content": None, "story_url": None, "read_more": "S_BUTTON"}
    descriptor_calendar_snippet_fields = {"CALENDAR_SNIPPET": None, "node_name": "CALENDAR_SNIPPET", "events": [],
                                          "event_count": None, "width": None,
                                          "audience": [], "categories": []}
    descriptor_slideshow_snippet_fields = {"SLIDESHOW_SNIPPET": None, "node_name": "SLIDESHOW_SNIPPET", "id": None,
                                           "title": None, "text": None,
                                           "slides": "S_SLIDESHOW"}
    descriptor_event_snippet_fields = {"EVENT_SNIPPET": None, "node_name": "EVENT_SNIPPET", "name": None, "date": None,
                                       "time": None, "venue": None}
    descriptor_sign_snippet_fields = {"SIGN_SNIPPET": None, "node_name": "SIGN_SNIPPET", "name": None, "width": None,
                                      "height": None, "sign_type": None, "sign_background": None, "sign_border": None,
                                      "content": None, "styling": None}

    # Complex/predefined types
    descriptor_row_with_single_cell_fields = {"SINGLECELLROW": "REMOVE",
                                              "ROW": {"columns": [
                                                  {"COLUMN": None, "cells": ["S_CELL"],
                                                   "column_width": None, "descriptor": "COLUMN",
                                                   "node_name": "COLUMN"}],
                                                  "descriptor": "ROW", "node_name": "ROW"},
                                              "descriptor": "SINGLECELLROW"}
    descriptor_single_cell_table_fields = {"ONECELL": "REMOVE", "PAGE": "S_SINGLECELLROW", "descriptor": "PAGE"}
    descriptor_three_cell_row_fields = {"THREECELLROW": "REMOVE",
                                        "ROW": {
                                            "columns": [{"COLUMN": None, "descriptor": "COLUMN", "node_name": "COLUMN",
                                                         "cells": ["S_CELL"]},
                                                        {"COLUMN": None, "node_name": "COLUMN",
                                                         "cells": ["S_CELL"]},
                                                        {"COLUMN": None, "node_name": "COLUMN",
                                                         "cells": ["S_CELL"]},
                                                        ],
                                            "descriptor": "ROW", "node_name": "ROW"},
                                        "descriptor": "THREECELLROW"}

    descriptor_front_page_fields = {"FRONTPAGE": "REMOVE",
                                    "PAGE": {"name": None, "node_name": "PAGE",
                                             "rows": ["S_THREECELLROW", "S_THREECELLROW", "S_THREECELLROW"]},
                                    "descriptor": "FRONTPAGE"}
    descriptor_quick_link_page_fields = {"QUICK_LINKS": "REMOVE",
                                         "PAGE": {"name": None, "node_name": "PAGE",
                                                  "rows": ["S_INDEX_LINKS", "S_INDEX_LINKS", "S_INDEX_LINKS"]},
                                         "descriptor": "QUICK_LINKS"}

    descriptor_test_fields = {"ONECELL": "REMOVE", "PAGE": "S_SINGLECELLROW", "descriptor": "PAGE", "node_name": "PAGE"}
    descriptor_minimal_graph_fields = {"SIMPLEGRAPH": "REMOVE", "graph": {"id": None, "name": None, "purpose": None,
                                        "nodes": [{"id": None, "facet": {}},
                                                  {"id": None, "facet": {}}],
                                        "edges": [{"id": None, "directed": None, "start": None, "end": None}]},
                                        "descriptor": "SIMPLEGRAPH"}

    json_field_dictionary = dict()
    json_field_dictionary['PAGE'] = descriptor_page_layout
    json_field_dictionary['ROW'] = descriptor_row_layout
    json_field_dictionary['COLUMN'] = descriptor_column_layout
    json_field_dictionary['CELL'] = descriptor_cell_layout
    json_field_dictionary['BUTTON'] = descriptor_button_fields
    json_field_dictionary['GRAPH'] = descriptor_graph_fields
    json_field_dictionary['NODE'] = descriptor_graph_node_fields
    json_field_dictionary['EDGE'] = descriptor_graph_edge_fields

    json_field_dictionary['PICTURE'] = descriptor_picture_fields
    json_field_dictionary['SLIDESHOW'] = descriptor_slideshow_fields
    json_field_dictionary['STORY'] = descriptor_story_fields

    json_field_dictionary['STORY_SNIPPET'] = descriptor_story_snippet_fields
    json_field_dictionary['CALENDAR_SNIPPET'] = descriptor_calendar_snippet_fields
    json_field_dictionary['EVENT_SNIPPET'] = descriptor_event_snippet_fields
    json_field_dictionary['SIGN_SNIPPET'] = descriptor_sign_snippet_fields
    json_field_dictionary['INDEX_LINKS'] = descriptor_index_fields
    json_field_dictionary['SLIDESHOW_SNIPPET'] = descriptor_slideshow_snippet_fields
    json_field_dictionary['SINGLECELLROW'] = descriptor_row_with_single_cell_fields
    json_field_dictionary['ONECELL'] = descriptor_single_cell_table_fields
    json_field_dictionary['THREECELLROW'] = descriptor_three_cell_row_fields
    json_field_dictionary['FRONTPAGE'] = descriptor_front_page_fields
    json_field_dictionary['QUICK_LINKS'] = descriptor_quick_link_page_fields
    json_field_dictionary['SIMPLEGRAPH'] = descriptor_minimal_graph_fields
    json_field_dictionary['KEYWORD_NODE'] = descriptor_keyword_node_fields
    json_field_dictionary['KEYWORD_ELEMENT'] = descriptor_keyword_facet_node_fields

    # json_field_dictionary[''] = cls.
    json_primary_templates = ['PAGE', 'ROW', 'COLUMN', 'CELL', 'BUTTON', 'PICTURE', 'SLIDESHOW', 'STORY',
                              'STORY_SNIPPET', 'CALENDAR_SNIPPET', 'EVENT_SNIPPET', 'SIGN_SNIPPET',
                              'SLIDESHOW_SNIPPET', 'INDEX_LINKS', 'GRAPH', 'EDGE', 'NODE']

    def __init__(self, db_exec):
        self.db_exec = db_exec
        self.all_fields = JSONStorageManager.json_field_dictionary
        self.table_manager = self.db_exec.create_json_manager()
        self.template_functions = dict()

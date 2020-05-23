from flask_caching import Cache

cache = Cache()

# Is this module necessary?
#  - Need to extend to handle caching of things other than those covered by the cache decorator such as snippets

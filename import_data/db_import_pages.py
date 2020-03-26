from db_mgt.page_tables import Page
import urllib.parse as uparse


class ImportPageData(object):
    pages_to_include = 'select * from wp_posts where post_type="page";'
    revised_pages = 'select id, post_modified where post_type="revision" and post_parent=(%d)'
    pl = ['id', 'page_name','page_title','page_author','page_date''page_content'];
    wp = ['ID', 'guid', 'post_title', 'post_author', ('post_date','post_modified'), 'post_content' ]


    def __init__(self, db_session):
        self.db_session = db_session
        self.wp_post_fields = self.get_table_fields('wp_posts')
        self.page_fields = self.get_table_fields('page')

    def get_table_fields(self, table):
        sql = f'DESCRIBE {table};'
        res = self.db_session.execute(sql)
        fields = [x[0] for x in res.fetchall()]
        return fields

    def find_most_recent_revision(self, page_id):
        res = self.db_session.execute(ImportPageData.revised_pages.format(page_id)).fetchall()
        if res:
            pass

    def get_wp_post_data(self):
        res = self.db_session.execute(ImportPageData.pages_to_include).fetchall()
        for row in res:
            page_id = row[0]
            next_row = zip(self.wp_post_fields, res)
            yield next_row

    def get_row_from_id(self, row_id):
        sql = f'SELECT * from wp_posts  where ID= {row_id};'
        res = self.db_session.execute(sql).first();
        return res

    def get_author(self, user_id):
        sql = f'SELECT user_login from wp_users where ID= {user_id};'
        res = self.db_session.execute(sql).first()[0];
        return res

    def get_page_name(self, guid):
        if guid.isdigit():
            return guid
        elif guid.startswith('http'):
            parts = uparse.urlparse(guid)
            path = parts[2]
            ndx = -1
            if path.endswith('/'):
                ndx = -2
            page_name = path.split('/')[ndx]
            return page_name
        else:
            ValueError(f'Unknown guid type: {guid}')
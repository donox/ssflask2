from db_mgt.page_tables import Page
import urllib.parse as uparse
import unidecode
from db_mgt.db_exec import DBExec


class ImportPageData(object):
    """
    Route: '/admin/sst_import_database' = > db_import_pages
    Template: import_database_functions.jinja2
    Form: import_database_functions_form.py
    Processor: db_import_pages.py
    """
    pages_to_include = 'select * from wp_posts where post_type="page";'
    revised_pages = 'select id, post_modified from wp_posts where post_type="revision" and post_parent={}'
    pl = ['id', 'page_name','page_title','page_author','page_date''page_content'];
    wp = ['ID', 'guid', 'post_title', 'post_author', ('post_date','post_modified'), 'post_content' ]


    def __init__(self, db_exec: DBExec, current_form):
        self.db_exec = db_exec
        self.db_session = db_exec.get_db_session()
        self.wp_post_fields = self.get_table_fields('wp_posts')
        self.page_fields = self.get_table_fields('page')
        self.page_names = set()
        self.db_exec.set_current_form(current_form)


    def import_useable_pages_from_wp_database(self):
        dummy_page_name = 'page-dummy-{}'
        dummy_count = 0
        field_post_name = self.get_field_index('post_name', 'wp_posts')
        for page_row in self.get_wp_post_data():
            pr = [x for x in page_row]
            if not pr[field_post_name]:
                pr[field_post_name] = dummy_page_name.format(dummy_count)
                dummy_count += 1
            self.import_page(pr)

    def get_field_index(self, field, table):
        """Get index of field that will correspond to DB row value.

        Args:
            field(str): Name of field to find
            table(str): Name of table containing field

        Returns:
            int: index of field
        """
        if table == 'wp_posts':
            field_list = self.wp_post_fields
        elif table == 'page':
            field_list = self.page_fields
        else:
            raise SystemError(f'Unrecognized table: {table}')
        ndx = field_list.index(field)
        return ndx

    def get_table_fields(self, table: str):
        """Get list of fields in a MySQL table.

        Args:
            table: Name of table

        Returns(list): list of table field names

        """
        sql = f'DESCRIBE {table};'
        res = self.db_session.execute(sql)
        fields = [x[0].lower() for x in res.fetchall()]
        return fields

    def find_most_recent_revision(self, page_id: int):
        """Find ID of most recent revision of a page in wp_posts table.

        Args:
            page_id:

        Returns(int):    ID of most recent revision or None if no revisions.

        """
        sql = ImportPageData.revised_pages.format(page_id)
        res = self.db_session.execute(sql).fetchall()
        if res:
            l1 = [x[0] for x in res]
            l2 = [x[1] for x in res]
            l2max = l2.index(max(l2))
            return l1[l2max]
        else:
            None

    def get_wp_post_data(self):
        """Generator for row of data from wp_posts table.

        Returns(list(tuple)):  List of tuples containing {field name: value}

        """
        res = self.db_session.execute(ImportPageData.pages_to_include).fetchall()
        for row in res:
            page_id = row[0]
            best_revision = self.find_most_recent_revision(page_id)
            if best_revision:
                row = self.get_row_from_id(page_id)
            yield row

    def get_row_from_id(self, row_id):
        """Get specific row of data from wp_posts.

            Returns(list):  List of values of fields.
        """
        sql = f'SELECT * from wp_posts  where ID= {row_id};'
        res = self.db_session.execute(sql).first();
        return res

    def get_author(self, user_id):
        """Get name of author from id in wp_users.

        Args:
            user_id(int): user_id in wp_users.

        Returns: str - author name

        """
        sql = f'SELECT user_login from wp_users where ID= {user_id};'
        res = self.db_session.execute(sql).first()
        if res:
            return res[0]
        return None

    def get_page_slug(self, guid):
        """Get unique slug for this entry

        Args:
            guid: full URL as used by Wordpress

        Returns:
            Slug - last element of URL
        """
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

    def import_page(self, data_row: list):
        """

        Args:
            data_row:

        Returns:

        """
        post_id = data_row[self.get_field_index('id', 'wp_posts')]
        sql = f'select page_id from v_page_post where post_id={post_id};'

        # (1) Check if in v_page_post
        res = self.db_session.execute(sql).first()
        if res:
            # (2) If exists - check if it is newer than current page
            return None

        # (3) Make Page object and add to db
        title = unidecode.unidecode(data_row[self.get_field_index('post_title', 'wp_posts')])
        # page_name = self.get_page_slug(data_row[self.get_field_index('guid', 'wp_posts')])
        page_name = data_row[self.get_field_index('post_name', 'wp_posts')]
        count = 0   # There are duplicate names to defend against
        while page_name in self.page_names:
            page_name += str(count)
            count += 1
        self.page_names.add(page_name)
        author = self.get_author(data_row[self.get_field_index('post_author', 'wp_posts')])
        if not author:
            author = 'Author unknown'
        page_date = max(data_row[self.get_field_index('post_date', 'wp_posts')],
                        data_row[self.get_field_index('post_modified', 'wp_posts')])
        content = unidecode.unidecode(data_row[self.get_field_index('post_content', 'wp_posts')])
        new_page = Page(page_title=title, page_name=page_name, page_author=author, page_date=page_date,
                        page_content=content, page_status='publish', page_guid='TBD')
        new_page.add_to_db(self.db_session, commit=True)

        # (4) Add entry to v_page_post
        sql = f'insert into v_page_post (page_id, post_id ) values ({new_page.id},{post_id});'
        self.db_session.execute(sql)
        self.db_session.commit()

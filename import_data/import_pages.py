import csv
import re
from db_mgt.page_tables import Page

# These are needed when running standalone
from pathlib import Path
from dotenv import load_dotenv
env_path = '/home/don/devel/ssflask/.env'
load_dotenv(dotenv_path=env_path)
import db_mgt.setup as su


class ImportPageData(object):
    def __init__(self, session, datafile):
        self.session = session
        self.datafile = datafile
        self.page_ids_new = dict()           # tuple (old_id, old_parent) by new_id
        self.page_ids_old = dict()           # tuple (new_id, old_parent) by old_id


    def read_file(self):
        with open(self.datafile, 'r') as csv_in:
            csv_reader = csv.reader(csv_in, delimiter='\t')
            for line in csv_reader:
                yield line

    def update_db(self):
        page_names = set()
        for line in self.read_file():
            try:
                page_id, author, date, status, title, name, parent, content = line
                new_rec = Page()
                new_rec.page_content = content
                new_rec.page_author = author
                new_rec.page_title = title
                if name in page_names:          # Append '-d' as many times as needed till name is unique
                    while name in page_names:
                        name = name + '_d'
                page_names.add(name)
                new_rec.page_name = name
                new_rec.page_date = date
                # new_rec.page_parent = parent
                new_rec.page_status = status
                new_rec.page_guid = "Needs GUID"
                new_rec.add_to_db(self.session, commit=True)
                self.page_ids_new[new_rec.id] = (int(page_id), int(parent))
                self.page_ids_old[int(page_id)] = (new_rec.id, int(parent))
            except Exception as e:
                print(e)
                raise e

    def write_update_parents(self):
        with open ('/home/don/devel/update_parent_new.csv', 'w') as fl:
            writer = csv.writer(fl)
            for new_page_id, val in self.page_ids_new.items():
                old_page_id, parent = val
                writer.writerow([new_page_id, old_page_id, parent])
            fl.close()
        with open ('/home/don/devel/update_parent_old.csv', 'w') as fl:
            writer = csv.writer(fl)
            for old_page_id, val in self.page_ids_old.items():
                new_page_id, parent = val
                writer.writerow([old_page_id, new_page_id, parent])
            fl.close()

    def load_update_parents(self):
        with open('/home/don/devel/update_parent_new.csv', 'r') as fl:
            reader = csv.reader(fl)
            self.page_ids_new = dict()
            self.page_ids_old = dict()
            for line in reader:
                new_page_id, old_page_id, parent = line
                self.page_ids_new[int(new_page_id)] = (int(old_page_id), int(parent))
            fl.close()
        with open ('/home/don/devel/update_parent_old.csv', 'r') as fl:
            reader = csv.reader(fl)
            for line in reader:
                old_page_id, new_page_id, parent = line
                self.page_ids_old[int(old_page_id)] = (int(new_page_id), int(parent))
            fl.close()
        s0 = set([x[0] for x in self.page_ids_new.values()])
        s1 = set([x[1] for x in self.page_ids_new.values()])
        self.s3 = s0.intersection(s1)
        print("Number of parents: {}".format(len(list(self.s3))))

    def replace_line_breaks(self):
        repl_exp = re.compile(r'>\n<')
        target_pages = self.db_session.query(Page).all()
        next_commit_count = 100
        for page in target_pages:
            content = page.page_content
            if content:
                # Remove '\n' used to separate html elements and replace others with proper br tag
                content_rep = re.sub(repl_exp, '', content).replace('\n', '<br/>')
                self.db_session.query(Page).filter(Page.id == page.id). \
                    update({'page_content': content_rep})
                next_commit_count -= 1
                if not next_commit_count:
                    self.db_session.commit()
        self.db_session.commit()

    def update_parents(self):
        for new_page_id, val in self.page_ids_new.items():
            old_page_id, parent = val
            if parent in self.s3:
                try:
                    new_parent = self.page_ids_old[parent][0]
                    target_page = self.db_session.query(Page).filter(Page.id == new_page_id).\
                        update({'page_parent': new_parent})
                    self.db_session.commit()
                except:
                    print("{} page parent not found. Old page: {}, Parent: {}".format(new_page_id, old_page_id, parent))


if __name__ == '__main__':
    df = '/home/don/devel/foo.tsv'
    engine = su.get_engine()
    session = su.create_session(engine)
    tables = su.create_tables(engine)
    ipd = ImportPageData(session, df)
    print("Start update_db")
    ipd.update_db()
    print("Start write_update_parents")
    ipd.write_update_parents()
    print("Start load_update_parents")
    ipd.load_update_parents()
    print("Start update_parents")
    ipd.update_parents()
    print("Start replace_line_breaks")
    # ipd.replace_line_breaks()
    foo = 3

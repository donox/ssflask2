import pymysql
import sys
from config import Config


class TestPADB(object):
    """Test connectivity to PA database."""
    def __init__(self):
        self.conn = None

    def connect(self):
        self.conn = pymysql.connect(host=Config.SQLALCHEMY_DATABASE_HOST,
                                    user=Config.SQLALCHEMY_USERNAME,
                                    password=Config.SQLALCHEMY_PASSWORD,
                                    db=Config.SQLALCHEMY_DATABASE_NAME,
                                    charset='utf8mb4',
                                    cursorclass=pymysql.cursors.DictCursor)

    def query(self, sql):
        try:
            cursor = self.conn.cursor()
            cursor.execute(sql)
        except (AttributeError, pymysql.OperationalError):
            self.connect()
            cursor = self.conn.cursor()
            cursor.execute(sql)
        except Exception as e:
            print(f'TESTDB OTHER ERROR: {sys.exc_info()}')
            sys.stdout.flush()
        return cursor

    def test_connection(self):
        sql = "SHOW Databases;"
        cur = self.query(sql)
        # wait a long time for the Mysql connection to timeout
        cur = self.query(sql)
        # still works
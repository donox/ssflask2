from test_base import BaseTestCase
from ssfl.main.routes import sst_main
from flask import url_for


class MainRoutesTests(BaseTestCase):
    def test_sst_main(self):
        response = self.client.post(url_for('main_bp.main'))
        print(response)
from test_base import BaseTestCase, app
from flask import url_for


# Request to client:
# c = app.test_client()
# response = c.get('/test/url')
#
# Request with context:
# with app.app_context():
#     #test code here
#
# Request with response context
# with app.test_request_context():
#     # test code here

class MainRoutesTests(BaseTestCase):
    def test_sst_main(self):
        with app.app_context():
            response = self.client.get(url_for('admin_bp.admin'))      # /admin/test
        assert response.status_code == 200

    def test_get_download(self):
        with app.test_request_context():
            url = url_for('admin_bp.get_download', file_path='furk')
            response = self.client.get(url)      # /admin/test
        assert response.status_code == 404
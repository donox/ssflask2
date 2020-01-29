from test_base import BaseTestCase
import utilities.miscellaneous as misc


class TestMiscellaneous(BaseTestCase):
    def test_get_file_name(self):
        foo = misc.get_temp_file_name('dumb', 'dumber')
        self.assertIsNotNone(foo)

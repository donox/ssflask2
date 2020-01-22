from ssfl.tests import test_main
from ssfl.tests import test_manage_calendar_form
import unittest
import inspect


def get_methods(class_X):
   res = inspect.getmembers(class_X(), predicate=inspect.ismethod)
   methods = []
   for mbr, _ in res:
      if mbr.startswith('test_'):
         methods.append(mbr)
   return methods

def ssTTests():
   suite = unittest.TestSuite()
   res = get_methods(test_main.MainRoutesTests)
   for method in res:
      suite.addTest(test_main.MainRoutesTests(method))
   res = get_methods(test_manage_calendar_form.TestDBManageCalendarForm)
   for method in res:
      suite.addTest(test_manage_calendar_form.TestDBManageCalendarForm(method))
   return suite

runner = unittest.TextTestRunner(verbosity=2)
runner.run(ssTTests())
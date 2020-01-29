import shlex
import logging
import subprocess


class OvernightLogger(object):
    def __init__(self, log_name, log_directory):
        self.logger = logging.getLogger(log_name)
        self.logger.setLevel(logging.INFO)
        # create file handler which logs even debug messages
        fh = logging.FileHandler(log_directory + log_name + '.log')
        fh.setLevel(logging.INFO)
        # create console handler with a higher log level
        ch = logging.StreamHandler()
        ch.setLevel(logging.ERROR)
        # create formatter and add it to the handlers
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        ch.setFormatter(formatter)
        # add the handlers to the logger
        self.logger.addHandler(fh)
        self.logger.addHandler(ch)

    def make_info_entry(self, entry):
        self.logger.info(entry)

    def make_error_entry(self, entry):
        self.logger.error(entry)

    def close_logger(self):
        self.logger = None

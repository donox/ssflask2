import logging
from config import Config


class SsTLogger(object):
    def __init__(self):
        self.logger = None
        self.log_name = None
        self.log_directory = None
        self.logger_type = None
        self.handler = None

    def define_wsgi_logger(self):
        self.logger = logging.getLogger('root')
        wh = logging.StreamHandler()
        self.handler = wh
        self.logger.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        wh.setFormatter(formatter)
        self.logger.addHandler(wh)

    def define_file_logger(self, log_name):
        log_directory = Config.LOG_DIRECTORY
        self.logger_type = 'file'
        self.log_name = log_name
        self.log_directory = log_directory
        self.logger = logging.getLogger(log_name)
        # create file handler which logs even debug messages
        fh = logging.FileHandler(log_directory + log_name + '.log')
        self.handler = fh
        self.logger.setLevel(logging.INFO)
        # create formatter and add it to the handlers
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        # add the handlers to the logger
        self.logger.addHandler(fh)

    def define_console_logger(self, log_name, log_directory):
        self.log_name = log_name
        self.log_directory = log_directory
        self.logger = logging.getLogger(log_name)
        # create console handler with a higher log level
        ch = logging.StreamHandler()
        self.handler = ch
        self.logger.setLevel(logging.INFO)
        # create formatter and add it to the handlers
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        ch.setFormatter(formatter)
        # add the handlers to the logger
        self.logger.addHandler(ch)

    def make_info_entry(self, entry):
        self.logger.info(entry)

    def make_error_entry(self, entry):
        self.logger.error(entry)

    def close_logger(self):
        self.handler.flush()
        self.handler.close()
        self.logger = None

from .setup import get_engine, create_session, close_session
from .photo_tables import PhotoManager
from .page_tables import PageManager
from .json_tables import JSONTableManager





class DBExec(object):
    """DBExec provides access to Managers for each model class.

    A DBExec is instantiated for each request with a possible list of managers to be created.
    If a manager is requested that was not created initially, it will be created at that time.
    At the end of the request (finally clause) it is called to close the session and clean up managers.

    """
    def __init__(self, managers: list=[]):
        self.db_session = create_session(get_engine())
        self.available_managers = dict()
        self.available_managers['photo'] = (False, self.create_photo_manager)
        self.available_managers['page'] = (False, self.create_page_manager)
        self.available_managers['json'] = (False, self.create_json_manager)
        self.available_managers['user'] = (False, self.create_user_manager)
        self.available_managers['event'] = (False, self.create_event_manager)
        self.available_managers['calendar'] = (False, self.create_calendar_manager)
        self.available_managers['page_body'] = (False, self.create_page_body_manager)
        for manager in managers:
            if manager not in self.available_managers:
                raise SystemError(f'Attempt to create invalid model manager: {manager}')
            mgr = self.available_managers[manager][1](self.db_session)
            self.available_managers[manager] = (True, mgr)

    def get_db_session(self):
        return self.db_session

    def create_photo_manager(self):
        mgr = PhotoManager(self.db_session)
        return mgr

    def create_page_manager(self):
        mgr = PageManager(self.db_session)
        return mgr

    def create_json_manager(self):
        mgr = JSONTableManager(self.db_session)
        return mgr

    def create_user_manager(self):
        pass

    def create_event_manager(self):
        pass

    def create_calendar_manager(self):
        pass

    def create_page_body_manager(self):
        pass

    def get_manager(self, manager: str) -> any:
        if manager in self.available_managers:
            if self.available_managers[manager][0]:
                return self.available_managers[manager][1]
            else:
                mgr = self.available_managers[manager][1]()
                self.available_managers[manager] = (True, mgr)
                return mgr
        else:
            raise SystemError(f'Attempt to get non-existent manager: {manager}')

    def terminate(self):
        close_session(self.db_session)

from ssfl import db
from .base_table_manager import BaseTableManager
import datetime as dt


class AdminReportManager(BaseTableManager):
    def __init__(self, db_session):
        super().__init__(db_session)
        self.db_session = db_session

    def add_report_to_database(self, report, commit=True):
        report.add_to_db(self.db_session, commit=commit)


class AdminReport(db.Model):
    __tablename__ = 'admin_reports'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    creator = db.Column(db.Integer, nullable=False)
    entry_type = db.Column(db.String(length=32))
    content = db.Column(db.String(length=2048))
    status = db.Column(db.String(length=32), default='active')
    created = db.Column(db.DateTime, default='2001-01-01 01:01:01')


    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
        return self
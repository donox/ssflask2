from ssfl import db
from .base_table_manager import BaseTableManager
import datetime as dt


class AdminReportManager(BaseTableManager):
    """
    Route: '/admin/make_report' => manage_admin_reports
    Template: make_report.jinja2
    Display:  display_admin_report.jinja2
    Form: manage_admin_reports_form.py
    Processor: manage_admin_reports.py
    """
    def __init__(self, db_session):
        super().__init__(db_session)
        self.db_session = db_session
        self.get_report_field_value = self.get_table_value('admin_reports')

    def add_report_to_database(self, report, commit=True):
        report.add_to_db(self.db_session, commit=commit)

    def get_reports(self, nbr_reports):
        sql = f'select * from admin_reports order by created  limit {nbr_reports}'
        res = self.db_session.execute(sql).fetchall()
        results = []
        for row in res:
            gv = self.get_report_field_value(row)
            report = AdminReport(id=gv('id'), creator=gv('creator'), entry_type=gv('entry_type'), content=gv('content'),
                             status=gv('status'), created=gv('created'))
            results.append(report)
        return res



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
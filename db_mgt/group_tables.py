from ssfl import db
from .base_table_manager import BaseTableManager
import datetime as dt
from db_mgt.user_models import UserManager
from utilities.sst_exceptions import SsTSystemError


class GroupTableManager(BaseTableManager):
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
        self.get_group_field_value = self.get_table_value('sstgroup')

    def create_group(self, group):
        group.add_to_db(self.db_session, commit=True)

    def get_group_from_id(self, group_id):
        sql = f'select * from sstgroup where id={group_id}'
        res = self.db_session.execute(sql).first
        if res:
            gv = self.get_group_field_value(res)
            group = Group(id=gv('id'), owner=gv('owner'), group_name=gv('group_name'), group_purpose=gv('group_purpose'),
                             status=gv('status'), created=gv('created'))
            return group

    def get_group_id_from_name(self, group_name):
        sql = f'select id from sstgroup where group_name="{group_name}";'
        res = self.db_session.execute(sql).first()
        if res:
            return res[0]
        else:
            return None

    def remove_group(self, group_id):
        try:
            sql = f'delete from sstgroup_member where group_id={group_id};'
            self.db_session.execute(sql)
            sql = f'delete from sstgroup where id={group_id};'
            self.db_session.execute(sql)
            self.db_session.commit()
        except Exception as e:
            self.db_exec.add_error_to_form('Delete Group', f'Error deleting group: {e.args}')
            raise SsTSystemError('SQLAlchemy generated error', e.args)

    def check_for_member_in_group(self, group_id, member_id):
        sql = f'select id from sstgroup_member where group_id={group_id} and member_id={member_id};'
        res = self.db_session.execute(sql).first()
        if res:
            return True
        else:
            return False

    def add_member_to_group(self, group_id, member_id):
        if not self.check_for_member_in_group(group_id, member_id):
            mbr_rec = GroupMembers(group_id=group_id, member_id=member_id)
            mbr_rec.add_to_db(self.db_session, commit=True)
            return True
        return False

    def remove_member_from_group(self, group_id, member_id):
        sql = f'delete from sstgroup_member where group_id={group_id} and member_id={member_id};'
        if self.check_for_member_in_group(group_id, member_id):
            self.db_session.execute(sql)
            self.db_session.commit()
            return True
        return False

    def get_group_members(self, group_id):
        sql = f'select member_id from sstgroup_member where group_id={group_id};'
        res = self.db_session.execute(sql).fetchall()
        user_mgr = self.db_exec.get_user_manager()
        members = []
        for row in res:
            member_id = row[0]
            members.append(user_mgr.get_user_by_id(member_id))
        return members


class Group(db.Model):
    __tablename__ = 'sstgroup'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    owner = db.Column(db.Integer, nullable=False)           # User ID
    group_name = db.Column(db.String(length=64))
    group_purpose = db.Column(db.String(length=2048))
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

class GroupMembers(db.Model):
    __tablename__ = 'sstgroup_member'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    member_id = db.Column(db.Integer, nullable=False)           # User ID
    group_id = db.Column(db.Integer, nullable=False)            # Group ID
    membership_attributes = db.Column(db.String(length=2048))   # JSON string

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
        return self
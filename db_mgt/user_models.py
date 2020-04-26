from .base_table_manager import BaseTableManager
from utilities.sst_exceptions import SiteIdentifierError, SiteObjectNotFoundError
from utilities.miscellaneous import make_db_search_string
from flask_user import UserMixin
from ssfl import db
import datetime


class UserManager(BaseTableManager):
    def __init__(self, db_session):
        super().__init__(db_session)

    def get_user_id_from_email(self, email_address):
        sql = f'select id from users where email="{email_address}"; '
        res = self.db_session.execute(sql).fetchone()
        if res:
            return res[0]
        else:
            return None

    def delete_user_by_id(self, uid):
        sql = f'delete from users where id={uid};'
        res = self.db_session.execute(sql)



class User(db.Model, UserMixin):
    """Model for user accounts."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String, nullable=False, unique=False)
    email = db.Column(db.String(40), unique=True, nullable=False)
    password = db.Column(db.String(200), primary_key=False, unique=False, nullable=False)
    website = db.Column(db.String(60), index=False, unique=False, nullable=True)
    created_on = db.Column(db.DateTime, index=False, unique=False, nullable=True, default=datetime.datetime.utcnow)
    last_login = db.Column(db.DateTime, index=False, unique=False, nullable=True, default=datetime.datetime.utcnow)
    active = db.Column(db.Boolean, default=False)
    email_confirmed_at = db.Column(db.DateTime, index=False, unique=False, nullable=True, default='2000-01-01')
    roles = db.relationship('Role', secondary='user_roles', backref=db.backref('user', lazy='dynamic'))

    def add_to_db(self, session, commit=False):
        session.add(self)
        if commit:
            try:
                session.commit()
            except Exception as e:
                foo = 3
                raise e
        return self


class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer(), primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), unique=True)


# Define the UserRoles association table
class UserRoles(db.Model):
    __tablename__ = 'user_roles'
    id = db.Column(db.Integer(), primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer(), db.ForeignKey('users.id', ondelete='CASCADE'))
    role_id = db.Column(db.Integer(), db.ForeignKey('roles.id', ondelete='CASCADE'))

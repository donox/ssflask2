from .base_table_manager import BaseTableManager
from utilities.sst_exceptions import SiteIdentifierError, SiteObjectNotFoundError
from utilities.miscellaneous import make_db_search_string
from flask_user import UserMixin
from ssfl import db
import datetime
from flask import app



class UserManager(BaseTableManager):
    def __init__(self, db_session):
        super().__init__(db_session)
        self.get_group_field_value = self.get_table_value('users')

    def get_user_by_id(self, user_id):
        """Get user without filling in roles."""
        # Problem filling in roles as the user.roles field is a SQLAlchemy structure.
        sql = f'select * from users where id={user_id}'
        res = self.db_session.execute(sql).fetchone()
        if res:
            gv = self.get_group_field_value(res)
            # We populate only the fields we really use.
            user = User(id=gv('id'), username=gv('username'), email=gv('email'))
            return user
        else:
            return None

    def get_current_user(self):
        return UserMixin.get_user_by_token(app.session['user_id'])

    def get_available_roles(self):
        sql = f'select name from roles'
        res = self.db_session.execute(sql).fetchall()
        return [x[0] for x in res]

    def get_user_roles(self, user_id):
        sql = f'select role_id from user_roles where user_id={user_id};'
        res = self.db_session.execute(sql).fetchall()
        roles = []
        if res:
            for role in res:
                sql2 = f'select name from roles where id={role[0]}'
                res2 = self.db_session.execute(sql2).fetchone()
                if res2:
                    roles.append(res2[0])
        return roles

    def get_role_id(self, role_name):
        sql = f'select id from roles where name="{role_name}";'
        res = self.db_session.execute(sql).fetchone()
        return res[0]


    def remove_role_from_user(self, role, user_id):
        role_id = self.get_role_id(role)
        sql = f'delete from user_roles where role_id={role_id} and user_id={user_id};'
        self.db_session.execute(sql)
        self.db_session.commit()

    def add_role_to_user(self, role, user_id):
        role_id = self.get_role_id(role)
        sql = f'insert into user_roles (user_roles.role_id, user_roles.user_id) values ({role_id}, {user_id});'
        self.db_session.execute(sql)
        self.db_session.commit()

    def get_user_id_from_email(self, email_address):
        sql = f'select id from users where email="{email_address}"; '
        res = self.db_session.execute(sql).fetchone()
        if res:
            return res[0]
        else:
            return None

    def get_user_id_from_name(self, user_name):
        sql = f'select id from users where username="{user_name}"; '
        res = self.db_session.execute(sql).fetchone()
        if res:
            return res[0]
        else:
            return None

    def delete_user_by_id(self, uid):
        sql = f'delete from users where id={uid};'
        res = self.db_session.execute(sql)
        sql = f'delete from user_roles where user_id={uid};'
        res = self.db_session.execute(sql)
        self.db_session.commit()

    def get_user_name_from_id(self, uid):
        sql = f'select username from users where id={uid}'
        res = self.db_session.execute(sql).first()
        return res[0]

    def update_user(self, user):
        sql = f'update users set first_name="{user.first_name}", last_name="{user.last_name}", '
        sql += f'password="{user.password}", email="{user.email}" where id={user.id};'
        # SQLAlchemy apparently gives no indication of success/failure
        self.db_session.execute(sql)
        self.db_session.commit()


class User(db.Model, UserMixin):
    """Model for user accounts."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String, nullable=False, unique=False)
    first_name = db.Column(db.String(50), nullable=False, unique=False)
    last_name = db.Column(db.String(50), nullable=False, unique=False)
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

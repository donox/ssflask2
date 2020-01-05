from sqlalchemy import Column, ForeignKey, Integer, String, Date, Boolean, func, DateTime
from flask_user import current_user, login_required, roles_required, UserManager, UserMixin
from application import db

class User(db.Model, UserMixin):
    """Model for user accounts."""
    __tablename__ = 'users'

    id = db.Column(Integer,
                   primary_key=True)
    username = db.Column(String,
                         nullable=False,
                         unique=False)
    email = db.Column(String(40),
                      unique=True,
                      nullable=False)
    password = db.Column(String(200),
                         primary_key=False,
                         unique=False,
                         nullable=False)
    website = db.Column(String(60),
                        index=False,
                        unique=False,
                        nullable=True)
    created_on = db.Column(DateTime,
                           index=False,
                           unique=False,
                           nullable=True)
    last_login = db.Column(DateTime,
                           index=False,
                           unique=False,
                           nullable=True)
    active = db.Column(db.Boolean,
                       default=False)
    email_confirmed_at = db.Column(db.DateTime,
                                   index=False,
                                   unique=False,
                                   nullable=True,
                                   default='2000-01-01')
    roles = db.relationship('Role', secondary='user_roles',
                            backref=db.backref('user', lazy='dynamic'))


class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(50), unique=True)


# Define the UserRoles association table
class UserRoles(db.Model):
    __tablename__ = 'user_roles'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey('users.id', ondelete='CASCADE'))
    role_id = db.Column(db.Integer(), db.ForeignKey('roles.id', ondelete='CASCADE'))

from flask_user import UserMixin
from ssfl import db
import datetime


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

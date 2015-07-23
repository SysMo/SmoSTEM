'''
Created on Jul 18, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

from flask import Flask
app = Flask(__name__)
app.config.from_object('Settings')
app.debug = True

# REST-ful flask extension
from flask_restful import Api
api = Api(app)

# Mongo schema validator
from flask_mongoengine import MongoEngine
db = MongoEngine(app)

# Login functionality
from flask_login import LoginManager
loginManager = LoginManager(app)

# Password hashing
from flask_bcrypt import Bcrypt
bcrypt = Bcrypt(app)

# EMail
from flask_mail import Mail
mail = Mail(app)

# Access control
from flask_principal import Principal, Permission, RoleNeed
principals = Principal(app)
# Create a permission with a single Need, in this case a RoleNeed.
AdminPermission = Permission(RoleNeed('admin'))
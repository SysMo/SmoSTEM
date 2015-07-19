'''
Created on Jul 18, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

from flask import Flask
# REST-ful flask extension
from flask_restful import Api
# Mongo schema validator
#from mongokit import Connection
from flask_mongoengine import MongoEngine
# Login functionality
from flask_login import LoginManager
# Password hashing
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.config.from_object('Settings')
app.debug = True
api = Api(app)
db = MongoEngine(app)
#db = mongoConnection[app.config['STEM_DATABASE']]
loginManager = LoginManager(app)
bcrypt = Bcrypt(app)
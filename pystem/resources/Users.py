'''
Created on Jul 14, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

from flask import request
from flask_restful import Resource, abort
from bson.objectid import ObjectId
from mongokit import Document
from pystem.flask.Utilities import makeJsonResponse
from flask_login import UserMixin

class User(Document, UserMixin):
	__collection__ = "Users"
	use_dot_notation = True
	structure = {
		'id': unicode,
		'name': unicode,
		'email': unicode,
		'password': unicode,
		'active': bool
	}
	required_fields = ['id', 'name', 'email', 'password', 'active']
	
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
from ServerObjects import db

class Role(Document):
	__collection__ = "Roles"
	use_dot_notation = True
	structure = {
		'id': unicode,
		'name': unicode,
		'description': unicode,
	}
	required_fields = ['id', 'name', 'description']
	

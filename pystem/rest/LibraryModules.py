'''
Created on Jul 6, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''

from mongokit import Document
from flask_restful import Resource, abort
from pystem.flask.Utilities import jsonResponse

class LibraryModule(Document):
	__collection__ = "LibraryModules"
	structure = {
		'name': unicode,
		'description': unicode,
		'importPath': str,
		'importName': str,
		'functions': [{
			'name': unicode,
			'description': unicode,
			'arguments': [{
				'name': unicode,
				'description': unicode,
				'defaultValue': unicode
			}]
		}]
	}

ModuleNumpy = {
	'name': 'NumPy',
	'description': 'Array manipulations',
	'importPath': 'numpy',
	'importName': 'np',
	'_id': 'asdasdasdasd',
	'functions': [{
		'name': 'sin',
		'description': 'sine',
		'arguments': [{
			'name': 'x',
			'description': 'angle in radians',
			'defaultValue': ''
		}]}, {
		'name': 'cos',
		'description': 'cosine',
		'arguments': [{
			'name': 'x',
			'description': 'angle in radians',
			'defaultValue': ''
		}]
	}]
}
Modules = [ModuleNumpy]
class LibraryModuleAPI(Resource):
	def __init__(self, conn):
		self.conn = conn	

	def get(self, moduleID = None):
		if (moduleID == None):
			return jsonResponse([{'name' : module['name'], '_id' : module['_id']} for module in Modules])
'''
Created on Jul 6, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''
from flask import request
from flask_restful import Resource, abort
from bson.objectid import ObjectId
from mongokit import Document
from pystem.flask.Utilities import jsonResponse

class LibraryFunction(Document):
	use_dot_notation = True
	structure = {
		'_id': ObjectId,
		'name': unicode,
		'description': unicode,
		'arguments': [{
			'name': unicode,
			'description': unicode,
			'defaultValue': unicode
		}]
	}
	default_values = {
		'name': 'function'
	}

class LibraryModule(Document):
	__collection__ = "LibraryModules"
	use_dot_notation = True
	structure = {
		'name': unicode,
		'description': unicode,
		'importPath': str,
		'importName': str,
		'functions': [LibraryFunction]
	}

ModuleNumpy = {
	'name': 'NumPy',
	'description': 'Array manipulations',
	'importPath': 'numpy',
	'importName': 'np',
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
		if (moduleID is None):
			#full = request.args.get('full', False)
			cursor = self.conn.LibraryModules.find({}, {'name': True, 'description': True}, sort = [('name', 1)])
			return jsonResponse(list(cursor))
		else:
			module = self.conn.LibraryModules.one({'_id': ObjectId(moduleID)})
			print jsonResponse(module)
			if (module is None):
				abort(500, msg = "No module exists with this ID")
			return jsonResponse(module)
# 		if (moduleID == None):
# 			return jsonResponse([{'_id' : module['_id'], 'name' : module['name'], 'description': module['description']} for module in Modules])
# 		else:
# 			return ModuleNumpy
	
	def post(self, moduleID = None):
		if (moduleID == None):
			newModule = self.conn.LibraryModule()
			print newModule
			newModule.save()
			return jsonResponse({'_id': newModule._id})
		else:
			params = request.args
			action = params.get('action')			
			if (action == "createFunction"):
				function = LibraryFunction()
				print function
			else:
				abort(500, msg = "Unknown action {}".format(action))
		
	def delete(self, moduleID):
		self.conn.LibraryModules.remove({"_id": ObjectId(moduleID)})
		return {'status': 0}

	def put(self, moduleID):
		putData = request.json
		self.conn.LibraryModules.update(
			{'_id': ObjectId(moduleID)}, {
				'$set': {
					'name': putData.get('name'),
					'description': putData.get('description'),
					'importPath': putData.get('importPath'),
					'importName': putData.get('importName')
				}
			}, upsert = False
		)
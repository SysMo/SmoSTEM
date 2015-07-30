'''
Created on Jul 6, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''
from flask import request
from bson.objectid import ObjectId
from pystem.flask.Utilities import makeJsonResponse, parseJsonResponse
from StemResource import StemResource
from pystem.Exceptions import APIException
from pystem.flask import db, AdminPermission
import mongoengine.fields as F
from mongoengine.errors import DoesNotExist

class FunctionArgument(db.EmbeddedDocument):
	name = F.StringField(required=True, default = '')
	description = F.StringField()	
	
class LibraryFunction(db.EmbeddedDocument):
	name = F.StringField(required=True, default = '')
	description = F.StringField()
	arguments = F.ListField(F.EmbeddedDocumentField(FunctionArgument))

class LibraryModule(db.Document):
	meta = {'collection': 'LibraryModules'}
	name = F.StringField(required=True, default = '<noname>')
	description = F.StringField()
	importPath = F.StringField()
	importName = F.StringField()
	functions = F.ListField(F.EmbeddedDocumentField(LibraryFunction))
	
class LibraryModuleAPI(StemResource):
	def get(self, moduleID = None):
		if (moduleID is None):
			full = request.args.get('full', False)
			if (full):
				cursor = LibraryModule._get_collection().find(sort = [('name', 1)])
			else:
				cursor = LibraryModule._get_collection().find({}, {'name': True, 'description': True}, sort = [('name', 1)])
			return makeJsonResponse(list(cursor))
		else:
			module = LibraryModule._get_collection().find_one({'_id': moduleID})
			if (module is None):
				raise APIException("No module exists with ID {}".format(moduleID))
			return makeJsonResponse(module)
	
	def post(self, moduleID = None):
		with AdminPermission.require():
			if (moduleID == None):
				newModule = LibraryModule()
				newModule.save()
				return makeJsonResponse({'_id': newModule.id})
			else:
				params = request.args
				action = params.get('action')			
				raise APIException("Unknown POST action {}".format(action))
		
	def delete(self, moduleID):
		with AdminPermission.require():
			LibraryModule.objects.get(id = moduleID).delete()
			return {'msg': 'Module deleted'}

	def put(self, moduleID):
		with AdminPermission.require():
			moduleData = parseJsonResponse(request.data)
			del moduleData['_id']
			module = LibraryModule.objects.get(id = moduleID)
			module.modify(**moduleData)
			module.save()

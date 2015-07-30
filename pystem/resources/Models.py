'''
Created on Jun 29, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

import datetime
from flask import request
from flask_login import current_user
from bson.objectid import ObjectId
import mongoengine.fields as F
from pystem.flask.Utilities import makeJsonResponse, parseJsonResponse
from StemResource import StemResource
from pystem.Exceptions import APIException, LoginRequiredError,\
	UnauthorizedError
from pystem.flask import db, AdminPermission
from pystem.model.ModelCalculator import ModelCalculator
from Users import User 
from pystem.resources import ModelPermissions as MP
from mongoengine.errors import DoesNotExist

class ModelField(db.EmbeddedDocument):
	meta = {'allow_inheritance': True}
	id = F.StringField()
	name = F.StringField(required = True)
	label = F.StringField()
	type = F.StringField(required = True)

class FloatField(ModelField):
	value = F.FloatField(required = True)
	quantity = F.StringField(required = True)
	displayUnit = F.StringField(required = True)

class TableColumn(db.EmbeddedDocument):
	width = F.IntField(default = 100)
	unitOptions = F.ListField(F.StringField())
	displayUnit = F.StringField()
	name = F.StringField(required = True)
	quantity = F.StringField(required = True)
	description = F.StringField()
	format = F.StringField()

class TableField(ModelField):
	value = F.DynamicField()
	columns = F.ListField(F.EmbeddedDocumentField(TableColumn))

class FormulasField(ModelField):
	value = F.StringField()
	height = F.StringField()

class BooleanField(ModelField):
	value = F.BooleanField()

class ChoicesField(ModelField):
	choices = F.ListField(F.StringField())
	value = F.StringField()

class TextField(ModelField):
	value = F.StringField()
	
class Layout(db.EmbeddedDocument):
	id = F.StringField()
	title = F.StringField()
	width = F.StringField(choices = ('narrow', 'wide'))
	height = F.StringField(default = '600px')
	type = F.StringField(choices = ('grid', 'free'))
	image = F.StringField(default = None)
	fields = F.ListField(F.EmbeddedDocumentField(ModelField))
	hasScope = F.BooleanField(required = True, default = False) 

class Board(db.EmbeddedDocument):
	layouts = F.ListField(F.EmbeddedDocumentField(Layout), default = [])

class Model(db.Document):
	meta = {
		'collection': 'Models',
		'indexes': ['name']
	}
	name = F.StringField(max_length = 200, required=True, default = 'Untitled')
	description = F.StringField(default = '')
	created = F.DateTimeField(default = datetime.datetime.utcnow)
	owner = F.ReferenceField(User, required = True)
	publicAccess = F.EmbeddedDocumentField(MP.ModelPublicAccess, default = MP.ModelPublicAccess)
	board = F.EmbeddedDocumentField(Board, default = Board)
	background = F.StringField()

class ModelUserAccess(db.Document):
	meta = {
		'collection': 'ModelUserAccess',
		'indexes': ['user', 'model']
	}	
	user = F.ReferenceField(User, required = True)
	model = F.ReferenceField(Model, required = True)
	list = F.BooleanField(default = False)
	view = F.BooleanField(default = False)
	edit = F.BooleanField(default = False)
	copy = F.BooleanField(default = False)
	remove = F.BooleanField(default = False)


def migrate():
	t2c = {
		'stem.ScalarField': 'FloatField', 
		'stem.TableField': 'TableField', 
		'stem.FormulasField': 'FormulasField',
		'stem.BoolField': 'BooleanField',
		'stem.TextField': 'TextField',
		'stem.ChoiceField': 'ChoicesField'
		}
	modelCursor = Model._get_collection().find()
	for model in modelCursor:
		for layout in model['board']['layouts']:
			for field in layout['fields']:
				#print field['_cls']
				field['_cls'] = t2c[field['type']]
		Model._get_collection().update({'_id': model['_id']}, model)
	print("Finished migration")
#migrate()
		
class ModelAPI(StemResource):
	def get(self, modelID = None):
		"""
		Returns a model or a list of models
		"""
		if (modelID is None):
			# Query all the models
			responseFields = {'name': True, 'description': True, 'created': True, 'owner': True}
			modelCollection = Model._get_collection()
			userCollection = User._get_collection()
			models = None
			if current_user.is_authenticated():
				user = current_user._get_current_object()
				#modelUserRelation = [own, shared, public, all]
				modelUserRelation = request.args.get('modelUserRelation', 'own')
				if (modelUserRelation == 'own'):
					searchFilter = {'owner': user.id}
				elif (modelUserRelation == 'shared'):
					models = []
					sharedModelAccess = ModelUserAccess.objects(user = user, list = True)
					for modelAccess in sharedModelAccess:
						model = modelAccess.model
						models.append({									
							'name': model.name,
							'description': model.description,
							'created': model.created,
							'owner': model.owner.username,
							'access': {'view': modelAccess.view, 'copy': modelAccess.copy, 
									'edit': modelAccess.edit, 'remove': modelAccess.remove}
						})					
				elif (modelUserRelation == 'public'):
					searchFilter = {'publicAccess.list': True}
					responseFields['publicAccess'] = True
				elif (modelUserRelation == 'all'):
					if (AdminPermission.can()):
						searchFilter = {}
					else:
						raise UnauthorizedError('Only administrators can list all models in the database')
				else:
					raise APIException('Invalid value for modelUserRelation, must be one of [own, shared, public, all]')
			else:
				searchFilter = {'publicAccess.list': True}
				responseFields['publicAccess'] = True
			if (models is None):
				models = list(Model._get_collection().find(searchFilter, responseFields, sort = [('name', 1)]))
				for model in models:
					model['owner'] = userCollection.find_one({'_id': model['owner']})['username']
			return makeJsonResponse(models)
		else:
			# Get a single model
			try:
				model = Model.objects.get(id = modelID)
			except DoesNotExist:
				raise APIException("No model exists with ID {}".format(modelID))
			permission = MP.ModelViewPermission(model)
			if (permission.can()):
				sharedModelAccess = ModelUserAccess.objects(model = model)
				accessList = []
				for modelAccess in sharedModelAccess:
					modelAccessDict = modelAccess.to_mongo()
					modelAccessDict['user'] = modelAccess.user.username
					del modelAccessDict['model']
					accessList.append(modelAccessDict)
				model = model.to_mongo()
				model['userAccess'] = accessList
				return makeJsonResponse(model)
			else:
				raise UnauthorizedError('You have no permissions to view this model')

	def post(self, modelID = None):
		"""
		Create a new model or run an action on model
		"""
		if not current_user.is_authenticated():
			raise LoginRequiredError()
		user = current_user._get_current_object()
		action = request.args.get('action', 'create')
#		try:
		if (action == 'create'):
			# Create new model
			model = Model(owner = user)
			model.save()
			return makeJsonResponse({'_id': model.id})
		elif (action == 'clone'):
			# Duplicate existing model
			model = Model.objects.get(id = modelID)
			permission = MP.ModelCopyPermission(model)
			if (permission.can()):
				model.id = None
				model.name = 'Copy of ' + model.name
				model.created = datetime.datetime.utcnow()
				model.owner = user
				model.save()
				return makeJsonResponse({'_id': model.id})
			else:
				raise UnauthorizedError('You have no permissions to copy this model')
		elif (action == 'compute'):
			modelData = parseJsonResponse(request.data)
			ex = ModelCalculator(modelData)
			ex.compute()
			return makeJsonResponse(modelData, 'Model computed')
		else:
			raise APIException('Unknown POST action {} for ModelAPI'.format(action))

	
	def delete(self, modelID):
		""" Delete a model"""
		model = Model.objects.get(id = modelID)
		permission = MP.ModelDeletePermission(model)
		if (permission.can()):			
			model.delete()
			return makeJsonResponse(None, 'Model deleted')
		else:
			raise UnauthorizedError('You have no permissions to delete this model')

	def put(self, modelID):
		"""Updates a model definition"""
		model = Model.objects.get(id = modelID)
		permission = MP.ModelEditPermission(model)
		if (permission.can()):			
			modelData = parseJsonResponse(request.data)
			model.modify(
				name = modelData['name'],
				description = modelData['description'],
				board = Board(**modelData['board']),
				background = modelData.get('background')
			)
			model.save()
			return makeJsonResponse(None, 'Model saved')
		else:
			raise UnauthorizedError('You have no permissions to save changes to this model')
			
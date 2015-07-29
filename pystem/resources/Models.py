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
from ServerObjects import db, AdminPermission
from pystem.model.ModelCalculator import ModelCalculator
from Users import User 
from bson.code import Code
from pystem.resources import ModelPermissions as MP
from mongoengine.errors import DoesNotExist

class ModelAccessPermission(db.EmbeddedDocument):
	list = F.BooleanField(default = False)
	view = F.BooleanField(default = False)
	edit = F.BooleanField(default = False)
	copy = F.BooleanField(default = False)
	delete = F.BooleanField(default = False)

class Layout(db.EmbeddedDocument):
	id = F.StringField()
	title = F.StringField()
	width = F.StringField(choices = ('narrow', 'wide'))
	height = F.StringField(default = '600px')
	type = F.StringField(choices = ('grid', 'free'))
	image = F.StringField(default = None)
	fields = F.ListField()
	hasScope = F.BooleanField(default = False) 

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
	publicAccess = F.EmbeddedDocumentField(ModelAccessPermission, default = ModelAccessPermission)
	board = F.EmbeddedDocumentField(Board, default = Board)
	background = F.StringField()
	
class ModelAPI(StemResource):
	def get(self, modelID = None):
		"""
		Returns a model or a list of models
		"""
		if (modelID is None):
			responseFields = {'name': True, 'description': True, 'created': True, 'owner': True}
			if current_user.is_authenticated():
				user = current_user._get_current_object()
				if (AdminPermission.can()):
					searchFilter = {}
				else:
					searchFilter = {'owner': user.id}
			else:
				searchFilter = {} 
			modelCursor = list(Model._get_collection().find(searchFilter, responseFields, sort = [('name', 1)]))
			for model in modelCursor:
				model['owner'] = User.objects.get(id = model['owner'])['username']
			return makeJsonResponse(modelCursor)
		else:
			try:
				model = Model.objects.get(id = modelID)
			except DoesNotExist:
				raise APIException("No model exists with ID {}".format(modelID))
			permission = MP.ModelViewPermission(model)
			if (permission.can()):
				return makeJsonResponse(model.to_mongo())
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
			
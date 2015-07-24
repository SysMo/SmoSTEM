'''
Created on Jun 29, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

import datetime
from flask import request
from flask_login import current_user
from bson.objectid import ObjectId
from pystem.flask.Utilities import makeJsonResponse, parseJsonResponse
from StemResource import StemResource
from pystem.Exceptions import APIException, LoginRequiredError
from ServerObjects import db
import mongoengine.fields as F
from pystem.model.ModelCalculator import ModelCalculator

# from mongokit import Document
# class Model(Document):
# 	__collection__ = "Models"
# 	use_dot_notation = True
# 	structure = {
# 			'name': unicode,
# 			'description': unicode,
# 			'created': datetime.datetime,
# 			'board': {
# 				'layouts': []
# 			},
# 			'background': unicode
# 	}
# 	required_fields = ['name']
# 	default_values = {
# 		'name': u'Untitled',
# 		'description': u'',
# 		'created': datetime.datetime.utcnow,
# 	}

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
	board = F.EmbeddedDocumentField(Board, default = Board)
	background = F.StringField()
	
class ModelAPI(StemResource):
	def get(self, modelID = None):
		"""
		Returns a model or a list of models
		"""
		if (modelID is None):
			modelCursor = Model._get_collection().find({}, {'name': True, 'description': True, 'created': True}, sort = [('name', 1)])
			return makeJsonResponse(list(modelCursor))
		else:
			model = Model._get_collection().find_one({"_id": modelID})
			if (model == None):
				raise APIException("No model exists with ID {}".format(modelID))
			return makeJsonResponse(model)

	def post(self, modelID = None):
		"""
		Create a new model or run an action on model
		"""
		if not current_user.is_authenticated():
			raise LoginRequiredError()
		action = request.args.get('action', 'create')
#		try:
		if (action == 'create'):
			# Create new model
			model = Model()
			print model
			print model.to_json()
			model.save()
			return makeJsonResponse({'_id': model.id})
		elif (action == 'clone'):
			# Duplicate existing model
			model = Model.objects.get(id = modelID)
			model.id = None
			model.name = 'Copy of ' + model.name
			model.created = datetime.datetime.utcnow()
			model.save()
			return makeJsonResponse({'_id': model.id})
		elif (action == 'compute'):
			modelData = parseJsonResponse(request.data)
			ex = ModelCalculator(modelData)
			ex.compute()
			return makeJsonResponse(modelData, 'Model computed')
		else:
			raise APIException('Unknown POST action {} for ModelAPI'.format(action))

	
	def delete(self, modelID):
		""" Delete a model"""
		if not current_user.is_authenticated():
			raise LoginRequiredError()
		model = Model.objects.get(id = modelID)
		model.delete()
		return makeJsonResponse(None, 'Model deleted')

	def put(self, modelID):
		"""Updates a model definition"""
		if not current_user.is_authenticated():
			raise LoginRequiredError()
		modelData = parseJsonResponse(request.data)
		model = Model.objects.get(id = modelID)
		model.modify(
			name = modelData['name'],
			description = modelData['description'],
			board = Board(**modelData['board']),
			background = modelData.get('background')
		)
		model.save()
		return makeJsonResponse(None, 'Model saved')

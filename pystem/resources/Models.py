'''
Created on Jun 29, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

import datetime
import sys, traceback
from flask import request
from bson.objectid import ObjectId
from pystem.model.ModelActions import ModelCalculator
from mongokit import Document
from pystem.flask.Utilities import makeJsonResponse, parseJsonResponse
from pystem.Exceptions import APIException
from StemResource import StemResource

class Model(Document):
	__collection__ = "Models"
	use_dot_notation = True
	structure = {
			'name': unicode,
			'description': unicode,
			'created': datetime.datetime,
			'board': {
				'layouts': []
			},
			'background': unicode
	}
	required_fields = ['name']
	default_values = {
		'name': u'Untitled',
		'description': u'',
		'created': datetime.datetime.utcnow,
	}
			

class ModelAPI(StemResource):
	def get(self, modelID = None):
		"""
		Returns a model or a list of models
		"""
		if (modelID is None):
			modelCursor = self.conn.Models.find({}, {'name': True, 'description': True, 'created': True}, sort = [('name', 1)])
			return makeJsonResponse(list(modelCursor))
		else:
			model = self.conn.Models.one({"_id": ObjectId(modelID)})
			if (model == None):
				raise APIException("No model exists with ID {}".format(modelID))
			return makeJsonResponse(model)

	def post(self, modelID = None):
		"""
		Create a new model or run an action on model
		"""
		action = request.args.get('action', 'create')
#		try:
		if (action == 'create'):
			if (modelID is None):
				# Create new model
				model = self.conn.Model()
			else:
				# Duplicate existing model
				model = self.conn.Model.one({"_id": ObjectId(modelID)})
				del model['_id']
				model.name = 'Copy of ' + model.name
				model.created = datetime.datetime.utcnow()
			model.save()
			return makeJsonResponse({'_id': model._id})
		elif (action == 'compute'):
			modelData = parseJsonResponse(request.data)
			ex = ModelCalculator(modelData)
			ex.compute()
			return makeJsonResponse(modelData)
		else:
			raise APIException('Unknown POST action {} for ModelAPI'.format(action))

	
	def delete(self, modelID):
		self.conn.Models.remove({"_id": ObjectId(modelID)})
		return {'status': 0}

	def put(self, modelID):
		# update a model definition
		modelData = parseJsonResponse(request.data)
		self.conn.Models.update({ '_id': ObjectId(modelID)} , { '$set': {
				'name': modelData['name'],
				'description': modelData['description'],
				'board': modelData['board'],
				'background': modelData['background']
			}
		}) 

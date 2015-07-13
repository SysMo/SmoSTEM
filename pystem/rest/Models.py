'''
Created on Jun 29, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

import datetime
import sys, traceback
from flask import request
from flask_restful import Resource, abort
from bson.objectid import ObjectId
from pystem.model.ModelActions import ModelActionExecutor
from mongokit import Document
from pystem.flask.Utilities import makeJsonResponse, parseJsonResponse

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

class ModelAPI(Resource):
	def __init__(self, conn):
		self.conn = conn
		
	def get(self, modelID = None):
		"""
		Returns a model or a list of models
		"""
		if (modelID is None):
			modelCursor = self.conn.Models.find({}, {'name': True, 'description': True, 'created': True})
			return makeJsonResponse(list(modelCursor))
		else:
			model = self.conn.Models.one({"_id": ObjectId(modelID)})
			print model
			if (model == None):
				abort(500, msg = "No model exists with this ID")
			return makeJsonResponse(model)

	def post(self, modelID = None):
		"""
		Create a new model or run an action on model
		"""
		# TODO: This is a mess, have to fix it
		params = request.args
		if (modelID is None):
			model = self.conn.Model()
			modelID = self.conn.Models.insert(model)
			return makeJsonResponse({'_id': modelID})
		else:
			action = params['action']
			try:
				if (action == 'compute'):
					modelData = parseJsonResponse(request.data)
					ex = ModelActionExecutor(modelData)
					ex.execute(action)
					return makeJsonResponse(modelData)
				elif (action == 'duplicate'):
					# Copy object (not sure if it works)
					model = self.conn.Model.one({"_id": ObjectId(modelID)})
					del model['_id']
					model.name = 'Copy of ' + model.name
					model.created = datetime.datetime.utcnow()
					model.save()
					return makeJsonResponse({'_id': model._id})
				else:
					raise Exception('Unknown action {}'.format(action))
			except Exception, e:
				tb = traceback.format_exc()
				print type(e)
				abort(500,
					msg = "Unhandled error",
					exception = sys.exc_info()[0].__name__ + ": " + str(e),
					traceback = tb
				)
	
	def delete(self, modelID):
		self.conn.Models.remove({"_id": ObjectId(modelID)})
		return {'status': 0}

	def put(self, modelID):
		# update a model definition
		modelData = parseJsonResponse(request.data)
		model = self.conn.Model(modelData)
		model.created = datetime.datetime.strptime(model.created, "%Y-%m-%d %H:%M:%S")
		model.save()

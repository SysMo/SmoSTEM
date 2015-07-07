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
from pystem.flask.Utilities import jsonResponse

class Model(Document):
	__collection__ = "Models"
	structure = {
			'name': unicode,
			'description': unicode,
			'created': datetime.datetime,
			'board': {
				'layouts': []
			},
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
			return jsonResponse(list(modelCursor))
		else:
			model = self.conn.Models.one({"_id": ObjectId(modelID)})
			print model
			if (model == None):
				abort(500, msg = "No model exists with this ID")
			return jsonResponse(model)

	def post(self, modelID = None):
		"""
		Create a new model or run an action on model
		"""
		modelData = request.json
		params = request.args
		if (modelID is None):
			model = self.conn.Model()
			modelID = self.conn.Models.insert(model)
			return jsonResponse({'_id': modelID})
		else:
			action = params['action']
			try:
				ex = ModelActionExecutor(modelData)
				ex.execute(action)
				return modelData
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
		putData = request.json
		#print putData.get('board').get('layouts')
		print putData
		self.conn.Models.update(
			{'_id': ObjectId(modelID)}, {
				'$set': {
					'name': putData.get('name'), 
					'description': putData.get('description'),
					'board': {
						'layouts' : putData.get('board').get('layouts'),
					}
				}
			}, upsert=False)
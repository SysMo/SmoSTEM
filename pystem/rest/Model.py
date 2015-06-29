'''
Created on Jun 29, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

import datetime
from flask import request
from flask_restful import Resource
from bson.objectid import ObjectId
from pystem.model.ModelActions import ModelActionExecutor

class ModelAPI(Resource):
	def __init__(self, db):
		self.db = db
		
	@property
	def Models(self):
		"""
		Link to the Models collection in the DB
		"""
		#return mongoClient[app.config['STEM_DATABASE']].Models
		return self.db.Models

	def toJSTypes(self, model):
		""" Helper to convert BSON types to JS types suitable for rendering """
		model['created'] = model['created'].strftime('%Y-%m-%d %H:%M:%S')
		model['_id'] = str(model['_id'])

	def create(self, modelData):
		""" Helper to create a new model and initialize it with default values """
		model = {
			'name': modelData.get('name', u'Untitled'),
			'description': modelData.get('description', u'Lorem ipsum dolores ....'),
			'created': datetime.datetime.utcnow(),
			'board': modelData.get('board', {
				'layouts': []
			}),
			'equations': modelData.get('equations', '')
		}
		return model

	def get(self, modelID = None):
		"""
		Returns a model or a list of models
		"""
		if (modelID is None):
			modelCursor = self.Models.find() #projection = ['_id', 'name', 'description', 'created']
			models = []
			for model in modelCursor:
				self.toJSTypes(model)
				models.append(model)
			return models
		else:
			model = self.Models.find_one({"_id": ObjectId(modelID)})
			self.toJSTypes(model)
			return model

	def post(self, modelID = None):
		"""
		Create a new model or run an action on model
		"""
		modelData = request.json
		params = request.args
		if (modelID is None):
			model = self.create(modelData)
			modelID = self.Models.insert(model)
			return {'_id': str(modelID)}
		else:
			action = params['action']
			ex = ModelActionExecutor(modelData)
			ex.execute(action)
			return modelData
			
			
	
	def delete(self, modelID):
		self.Models.remove({"_id": ObjectId(modelID)})
		return {'status': 0}

	def put(self, modelID):
		# update a model definition
		putData = request.json
		self.Models.update(
			{'_id': ObjectId(modelID)}, {
				'$set': {
					'name': putData.get('name'), 
					'description': putData.get('description'),
					'board': putData.get('board'),
					'equations': putData.get('equations')
				}
			}, upsert=False)
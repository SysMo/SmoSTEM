from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException
from flask.views import MethodView

# REST-ful flask extension
from flask_restful import Resource, Api

import datetime
from bson.objectid import ObjectId
from pymongo import MongoClient
from pystem.flask import Utilities as U

app = Flask(__name__)
app.config.from_object('Settings')
app.debug = True
api = Api(app)
mongoClient = MongoClient()


# Pages
@app.route("/")
def index():
	return render_template('StemBase.html')

@app.route("/ModelEditor/<modelID>")
def modelEditor(modelID):
	return render_template('ModelEditor.html', modelID = modelID)

class ModelAPI(Resource):
	@property
	def Models(self):
		"""
		Link to the Models collection in the DB
		"""
		return mongoClient[app.config['STEM_DATABASE']].Models

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

	def post(self):
		"""
		Create a new model
		"""
		postData = request.json
		model = self.create(postData)
		modelID = self.Models.insert(model)
		return {'_id': str(modelID)}
	
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
		return self.get(modelID)
	
api.add_resource(ModelAPI, '/stem/api/Models', '/stem/api/Models/<string:modelID>')


if __name__ == "__main__":
	app.run()

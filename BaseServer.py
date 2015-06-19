from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException
from flask.views import MethodView

import datetime
from bson.objectid import ObjectId
from pymongo import MongoClient
from pystem.flask import Utilities as U

app = Flask(__name__)
app.config.from_object('Settings')
app.debug = True
mongoClient = MongoClient()
#stemDB = mongoClient[app.config['STEM_DATABASE']]

# Pages
@app.route("/")
def index():
	return render_template('StemBase.html')

@app.route("/ModelEditor/<modelID>")
def modelEditor(modelID):
	return render_template('ModelEditor.html', modelID = modelID)


# API's
class ModelAPI(MethodView):
	decorators = [] # Methods cannot be decorated
	
	@property
	def Models(self):
		"""
		Link to the Models collection in the DB
		"""
		return mongoClient[app.config['STEM_DATABASE']].Models

	def create(self, modelData):
		""" Create a new model with default values """
		model = {
			'name': modelData.get('name', u'Untitled'),
			'description': modelData.get('description', u'Lorem ipsum dolores ....'),
			'created': datetime.datetime.utcnow(),
			'layoutSections': modelData.get('layoutSections', []),
			'equations': modelData.get('equations', '')
		}
		return model
	
	def toJSTypes(self, model):
		""" Convert BSON types to JS types suitable for rendering """
		model['creationDate'] = model['creationDate'].strftime('%Y-%m-%d %H:%M:%S')
		model['_id'] = str(model['_id'])
	
	
	def get(self, modelID):
		
		if modelID is None:
			# return a list of models
			modelCursor = self.Models.find() #projection = ['_id', 'name', 'description', 'created']
			models = []
			for model in modelCursor:
				self.toJSTypes(model)
				models.append(model)
			return U.toJson(models)			
		else:
			# expose a single model
			model = self.Models.find_one({"_id": ObjectId(modelID)})
			return U.toJson(model)

	def post(self, modelID):
		postData = request.json
		if (modelID is None):
			# create a new model definition
			model = self.create(postData)
			modelID = self.Models.insert(model)
			return self.get(modelID)
		else:
			equationText = postData.get('equations', {})
			variables = postData.get('variables', {})
			exec(str(equationText), {}, variables)
			return jsonify({'values': variables})
		
		
	def delete(self, modelID):
		self.Models.remove({"_id": ObjectId(modelID)})
		return jsonify({'status': 0})

	def put(self, modelID):
		# update a model definition
		putData = request.json
		self.Models.update({'_id': ObjectId(modelID)}, 
			{'$set': {'name': putData.get('name'), 
					'description': putData.get('description'),
					'layoutSections': putData.get('layoutSections'),
					'equations': putData.get('equations')
					}
			}, upsert=False)
		return self.get(modelID)

class ComputeAPI(MethodView):
	def post(self, modelID):
		print request.json
		# perform computation
		return jsonify({'status': 0, 'message': 'performed computatoin on ' + modelID})

U.registerAPI(app, ModelAPI, 'ModelAPI', '/stem/api/Models', pk='modelID')

if __name__ == "__main__":
	app.run()

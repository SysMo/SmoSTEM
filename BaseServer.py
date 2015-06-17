from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException
from flask.views import MethodView

import datetime
import json
from bson import json_util
from bson.objectid import ObjectId
from pymongo import MongoClient

app = Flask(__name__)
#app.debug = True
mongoClient = MongoClient()
stemDB = mongoClient.stem

def toJson(data):
	"""Convert Mongo object(s) to JSON"""
	return json.dumps(data, default=json_util.default)

# Register a RESTful API
def registerAPI(view, endpoint, url, pk='id', pk_type='string'):
	"""Utility function to register RESTful API"""
	view_func = view.as_view(endpoint)
	app.add_url_rule(url, defaults={pk: None},
					 view_func=view_func, methods=['GET',])
	app.add_url_rule(url, view_func=view_func, methods=['POST',])
	app.add_url_rule('%s/<%s:%s>' % (url, pk_type, pk), view_func=view_func,
					 methods=['GET', 'PUT', 'DELETE'])

# Send JSON response on errors
def make_json_error(ex):
	response = jsonify(message=str(ex))
	response.status_code = (ex.code
	                        if isinstance(ex, HTTPException)
	                        else 500)
	return response

for code in default_exceptions.iterkeys():
	app.error_handler_spec[None][code] = make_json_error

# Pages
@app.route("/")
def index():
	return render_template('StemBase.html')

@app.route("/ModelEditor/<modelID>")
def modelEditor(modelID):
	return render_template('ModelEditor.html', modelID = modelID)


# API's
class ModelDefinitionAPI(MethodView):	
	decorators = [] # Methods cannot be decorated
	def get(self, modelID):
		if modelID is None:
			# return a list of model definitions
			modelCursor = stemDB.modelDefinitions.find(projection = ['_id', 'name', 'description', 'creationDate'])
			models = []
			for model in modelCursor:
				model['creationDate'] = model['creationDate'].strftime('%Y-%m-%d %H:%M:%S')
				model['_id'] = str(model['_id'])
				models.append(model)
			print models
			return toJson(models)			
		else:
			# expose a single model definition
			print modelID
			model = stemDB.modelDefinitions.find_one({"_id": ObjectId(modelID)})
			print model
			
			return toJson(model)

	def post(self):
		postData = request.json
		# create a new model definition
		modelDefinition = {
			'name': postData.get('name', u'Untitled'),
			'description': postData.get('description', u'Lorem ipsum dolores ....'),
			'creationDate': datetime.datetime.utcnow()
		}
		newModelID = stemDB.modelDefinitions.insert(modelDefinition)
		
		return jsonify({'status': 0, '_id': str(newModelID)})

	def delete(self, modelID):
		stemDB.modelDefinitions.remove({"_id": ObjectId(modelID)})
		return jsonify({'status': 0})

	def put(self, modelID):
		# update a model definition
		pass	

registerAPI(ModelDefinitionAPI, 'ModelDefinitionAPI', '/stem/api/ModelDefinitions', pk='modelID')

@app.route("/compute", methods=['POST'])
def compute():
	equationText = request.json.get('equations', {})
	variables = request.json.get('variables', {})
	exec(str(equationText), {}, variables)
	return jsonify({'values': variables})


if __name__ == "__main__":
	app.run()

import json
import sys
from flask import Flask, Response
from flask import render_template
from flask.json import jsonify

from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException

# REST-ful flask extension
from flask_restful import Api

from pymongo import MongoClient
from pystem.rest.Model import ModelAPI
from pystem.rest.Quantity import QuantityAPI


class StemAPI(Api):
	def handle_error(self, e):
		#exc_type, exc_value, tb = sys.exc_info()
		if isinstance(e, Exception):
			data = json.dumps({
				"msg": "Server raised exception",
				#"excMsg": str(exc_type) + ":" + str(e),
				#"traceback" : tb
			});
			response = Response(
				response = data,
		    	status = 500,
		     	mimetype = "application/json"
		 	)
			return response
		else:	
			return Api.handle_error(self, e)

app = Flask(__name__)
app.config.from_object('Settings')
app.debug = True
api = StemAPI(app)
mongoClient = MongoClient()

# Pages
@app.route("/")
def index():
	return render_template('StemBase.html')

@app.route("/ModelEditor/<modelID>")
def modelEditor(modelID):
	return render_template('ModelEditor.html', modelID = modelID)


	
api.add_resource(ModelAPI, '/stem/api/Models', '/stem/api/Models/<string:modelID>', 
		resource_class_kwargs = {'db':mongoClient[app.config['STEM_DATABASE']]})
api.add_resource(QuantityAPI, '/stem/api/Quantities', '/stem/api/Quantities/<string:quantityID>', 
		resource_class_kwargs = {'db':mongoClient[app.config['STEM_DATABASE']]})


if __name__ == "__main__":
	app.run()

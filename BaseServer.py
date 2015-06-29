from flask import Flask
from flask import render_template

from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException

# REST-ful flask extension
from flask_restful import Api

from pymongo import MongoClient
from pystem.rest.Model import ModelAPI
from pystem.rest.Quantity import QuantityAPI

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


	
api.add_resource(ModelAPI, '/stem/api/Models', '/stem/api/Models/<string:modelID>', 
		resource_class_kwargs = {'db':mongoClient[app.config['STEM_DATABASE']]})
api.add_resource(QuantityAPI, '/stem/api/Quantities', '/stem/api/Quantities/<string:quantityID>', 
		resource_class_kwargs = {'db':mongoClient[app.config['STEM_DATABASE']]})


if __name__ == "__main__":
	app.run()

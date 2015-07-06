import json
import sys
from flask import Flask, Response
from flask import render_template
from flask.json import jsonify

from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException

# REST-ful flask extension
from flask_restful import Api

from mongokit import Connection
from pystem.rest.Models import Model, ModelAPI 
from pystem.rest.Quantities import Quantity, QuantityAPI
from pystem.rest.LibraryModules import LibraryModule, LibraryModuleAPI 

app = Flask(__name__)
app.config.from_object('Settings')
app.debug = True
api = Api(app)
#mongoClient = MongoClient()
mongoConnection = Connection()

# Pages
@app.route("/")
def index():
	return render_template('StemBase.html')

@app.route("/Models")
def listModels():
	return render_template('Models.html')

@app.route("/ModelEditor/<modelID>")
def modelEditor(modelID):
	return render_template('ModelEditor.html', modelID = modelID)

@app.route("/Quantities")
def listQuantities():
	return render_template('Quantities.html')

@app.route("/QuantityEditor/<quantityID>")
def quantityEditor(quantityID):
	return render_template('QuantityEditor.html', quantityID = quantityID)
	

@app.route("/LibraryModules")
def listLibraryModules():
	return render_template('LibraryModules.html')


api.add_resource(ModelAPI, '/stem/api/Models', '/stem/api/Models/<string:modelID>', 
		resource_class_kwargs = {'conn':mongoConnection[app.config['STEM_DATABASE']]})
api.add_resource(QuantityAPI, '/stem/api/Quantities', '/stem/api/Quantities/<string:quantityID>', 
		resource_class_kwargs = {'conn':mongoConnection[app.config['STEM_DATABASE']]})
api.add_resource(LibraryModuleAPI, '/stem/api/LibraryModules', '/stem/api/LibraryModules/<string:moduleID>', 
		resource_class_kwargs = {'conn':mongoConnection[app.config['STEM_DATABASE']]})
mongoConnection.register([Quantity, Model, LibraryModule])


if __name__ == "__main__":
	app.run()

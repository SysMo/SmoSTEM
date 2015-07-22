import sys

from flask import render_template
from flask.json import jsonify

from ServerObjects import *

from pystem.resources.Models import Model, ModelAPI 
from pystem.resources.Quantities import Quantity, QuantityAPI
from pystem.resources.LibraryModules import LibraryModule, LibraryModuleAPI 
from pystem.resources.Users import User, UserAPI
from pystem.Exceptions import APIException, NonAPIException
import flask_login

from werkzeug.routing import BaseConverter, ValidationError
from bson.objectid import ObjectId
from bson.errors import InvalidId

# Custom converters
class ObjectIDConverter(BaseConverter):
	def to_python(self, value):
		try:
			return ObjectId(value)
		except (InvalidId, ValueError, TypeError):
			raise ValidationError()
	def to_url(self, value):
		return str(value)

app.url_map.converters['ObjectID'] = ObjectIDConverter


from flask_login import current_user
from flask_principal import identity_loaded, RoleNeed, UserNeed,\
	PermissionDenied

@identity_loaded.connect_via(app)
def on_identity_loaded(sender, identity):
	# Set the identity user object
	identity.user = current_user

	if (current_user.is_authenticated()):
		# Add the UserNeed to the identity
		identity.provides.add(UserNeed(current_user.get_id()))
	
		# Assuming the User model has a list of roles, update the
		# identity with the roles that the user provides
		if hasattr(current_user, 'roles'):
			for role in current_user.roles:
				identity.provides.add(RoleNeed(role.name))


@loginManager.user_loader
def loadUser(userID):
	return User.objects.get(id = ObjectId(userID))

# Pages
@app.route("/")
def index():
	return render_template('StemBase.html')

@app.route("/checkLogin")
def checkLogin():
	return "".format()

@app.route("/register")
def register():
	return render_template('Register.html')

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
@flask_login.login_required
def listLibraryModules():
	return render_template('LibraryModules.html')

@app.route("/LibraryModuleEditor/<moduleID>")
def libraryModuleEditor(moduleID):
	return render_template('LibraryModuleEditor.html', moduleID = moduleID)

api.add_resource(ModelAPI, '/stem/api/Models', '/stem/api/Models/<ObjectID:modelID>')
api.add_resource(QuantityAPI, '/stem/api/Quantities', '/stem/api/Quantities/<ObjectID:quantityID>')
api.add_resource(LibraryModuleAPI, '/stem/api/LibraryModules', '/stem/api/LibraryModules/<ObjectID:moduleID>')
api.add_resource(UserAPI, '/stem/api/Users')
#mongoConnection.register([Quantity, Model, LibraryModule, User])

#Exception handling
@app.errorhandler(APIException)
def handleAPIException(error):
	errorInfo = {
		'msg': str(error),
		'type': 'APIException',
		'excType': sys.exc_info()[0].__name__
	}
	response = jsonify(errorInfo)
	response.status_code = error.status_code
	return response

@app.errorhandler(NonAPIException)
def handleNonAPIException(error):
	errorInfo = {
		'msg': str(error),
		'type': 'Exception',
		'excType': error.excType,
		'traceback': error.traceback
	}
	response = jsonify(errorInfo)
	response.status_code = error.status_code
	return response

if __name__ == "__main__":
	app.run()

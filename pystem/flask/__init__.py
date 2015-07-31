'''
Created on Jul 18, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''
import os
import sys, traceback
from collections import namedtuple

from flask import render_template, redirect
from flask.json import jsonify

from pystem.Exceptions import APIException, NonAPIException

from werkzeug.routing import BaseConverter, ValidationError
from bson.objectid import ObjectId
from bson.errors import InvalidId
	
ROOT_FOLDER = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

from flask import Flask
app = Flask(__name__, 
		static_folder = os.path.join(ROOT_FOLDER, 'static'),
		template_folder = os.path.join(ROOT_FOLDER, 'templates')
)
app.config.from_pyfile(os.path.join(ROOT_FOLDER, 'config.py'))
app.debug = True

# REST-ful flask extension
from flask_restful import Api
api = Api(app)

# Mongo schema validator
from flask_mongoengine import MongoEngine
db = MongoEngine(app)

# Login functionality
from flask_login import LoginManager, current_user
loginManager = LoginManager(app)

# Password hashing
from flask_bcrypt import Bcrypt
bcrypt = Bcrypt(app)

# EMail
from flask_mail import Mail
mail = Mail(app)

# Access control
from flask_principal import Principal, Permission, Need, RoleNeed, UserNeed,\
	PermissionDenied, identity_loaded
principals = Principal(app)
# Create a permission with a single Need, in this case a RoleNeed.
AdminPermission = Permission(RoleNeed('admin'))
AnyUserNeed = Need('id', None)

# Admin module
import flask_admin
from flask_admin.base import AdminIndexView, expose
class StemAdminIndexView(AdminIndexView):
	@expose('/')
	def index(self):
		if not AdminPermission.can():
			return redirect('/')
		else:
			return super(StemAdminIndexView, self).index()
admin = flask_admin.Admin(app, template_mode='bootstrap3', index_view = StemAdminIndexView())

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

@identity_loaded.connect_via(app)
def on_identity_loaded(sender, identity):
	# Set the identity user object
	identity.user = current_user
	identity.provides.add(AnyUserNeed)
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
	users = User.objects(id = ObjectId(userID))
	if (len(users) == 0):
		return None
	else:
		return users.first()

# Pages
@app.route("/")
def index():
	import threading
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
def listLibraryModules():
	return render_template('LibraryModules.html')

@app.route("/LibraryModuleEditor/<moduleID>")
def libraryModuleEditor(moduleID):
	return render_template('LibraryModuleEditor.html', moduleID = moduleID)

# Register Restful API endpoints 
from pystem.resources.Models import Model, ModelAPI, ModelUserAccess
from pystem.resources.Quantities import Quantity, QuantityAPI
from pystem.resources.LibraryModules import LibraryModule, LibraryModuleAPI 
from pystem.resources.Users import User, UserAPI
api.add_resource(ModelAPI, '/stem/api/Models', '/stem/api/Models/<ObjectID:modelID>', '/stem/api/Models/<ObjectID:modelID>/<string:action>')
api.add_resource(QuantityAPI, '/stem/api/Quantities', '/stem/api/Quantities/<ObjectID:quantityID>')
api.add_resource(LibraryModuleAPI, '/stem/api/LibraryModules', '/stem/api/LibraryModules/<ObjectID:moduleID>')
api.add_resource(UserAPI, '/stem/api/Users/<string:action>')

# Admin views
import flask_admin.contrib.mongoengine as AdmME
import flask_admin.contrib.mongoengine.fields as AF
import jinja2.utils
class StemAdminView(AdmME.ModelView):
	def is_accessible(self):
		return AdminPermission.can()
	def _handle_view(self, name, **kwargs):
		if not self.is_accessible():
			return redirect('/')
			
admin.add_view(StemAdminView(User))
admin.add_view(StemAdminView(Model))

class ModelUserAccessView(StemAdminView):
	@jinja2.utils.contextfunction
	def get_list_value(self, context, model, name):
		if (name == 'model'):
			return model.model.name
		if (name == 'user'):
			return model.user.username
		return StemAdminView.get_list_value(self, context, model, name)
	
admin.add_view(ModelUserAccessView(ModelUserAccess))


#Exception handling
@app.errorhandler(APIException)
def handleAPIException(error):
	errorInfo = {
		'msg': unicode(error),
		'type': 'APIException',
		'excType': sys.exc_info()[0].__name__,
		'traceback': traceback.format_exc() if app.debug else None
	}
	response = jsonify(errorInfo)
	response.status_code = error.status_code
	return response

@app.errorhandler(NonAPIException)
def handleNonAPIException(error):
	errorInfo = {
		'msg': unicode(error),
		'type': 'Exception',
		'excType': error.excType,
		'traceback': error.traceback
	}
	response = jsonify(errorInfo)
	response.status_code = error.status_code
	return response

'''
Created on Jul 14, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

from flask import request, session, current_app
from pystem.flask.Utilities import makeJsonResponse, parseJsonResponse
from StemResource import StemResource
from flask_login import UserMixin
from pystem.Exceptions import APIException
from flask_login import login_user, logout_user, current_user
from ServerObjects import bcrypt, db
import mongoengine.fields as F
from mongoengine.errors import DoesNotExist, NotUniqueError
from flask_principal import Identity, AnonymousIdentity, identity_changed
#from mongokit import Document
# class User(Document, UserMixin):
# 	__collection__ = "Users"
# 	use_dot_notation = True
# 	structure = {
# 		'username': unicode,
# 		'email': unicode,
# 		'fullName': unicode,
# 		'password': unicode,
# 		'active': bool
# 	}
# 	indexes = [
# 		{
# 			'fields': 'email',  # note: this may be an array
# 			'unique': True,	 	# only unique values are allowed 
# 		},
# 		{
# 			'fields': 'username',  # note: this may be an array
# 			'unique': True,	 	# only unique values are allowed 
# 		},
# 	]	#required_fields = ['username', 'email', 'fullName', 'password', 'active']
# 	

class Role(db.Document):
	meta = {
		'collection': 'Roles',
	} 
	name = F.StringField(max_length=80, unique=True, primary_key = True)
	description = F.StringField(max_length=255)
	
class User(db.Document, UserMixin):
	meta = {
		'collection': 'Users',
		'indexes': [
			{
				'fields': ['username'],
				'unique': True
			},
			{
				'fields': ['email'],
				'unique': True
			},
 		]
	} 
	username = F.StringField(max_length = 20, required = True)
	email = F.EmailField(required = True)
	fullName = F.StringField(max_length = 50)
	password = F.StringField(required = True)
	active = F.BooleanField(default = True)
	roles = F.ListField(F.ReferenceField(Role), default=[])
	
	def get_id(self):
		return str(self.id)

class UserAPI(StemResource):
	def initUsersDB(self):
		Role(name = 'admin', description = 'administrators').save()
		Role(name = 'user', description = 'users').save()
	def post(self):
		action = request.args.get('action', None)
		if (action is None):
			raise APIException("Parameter 'action' must be defined for POST method to Users resource")
		if (action == 'create'):
			if (User.objects.count() == 0):
				self.initUsersDB();
			userData = parseJsonResponse(request.data)
			userData[u'active'] = True
			userData[u'password'] = unicode(bcrypt.generate_password_hash(userData[u'password']))
			user = User(**userData)
			userRole = Role.objects.get(name='user')
			user.roles = [userRole]
			try:
				user.save()
			except NotUniqueError, e:
				# TODO
				raise APIException('User with this name or email already exists')
			return makeJsonResponse({
				'msg': 'Successfully created user {}'.format(user.username)
			})
		elif (action == 'login'):
			userData = parseJsonResponse(request.data)
			if current_user.is_authenticated():
				return makeJsonResponse({'msg': 'You are already logged in'})
			else:
				try:
					user = User.objects.get(email = userData['id'])
				except DoesNotExist:
					raise APIException('User does not exist')
				passwordValid = bcrypt.check_password_hash(user.password, userData['password'])
				if (passwordValid):
					login_user(user)
					# Remove session keys set by Flask-Principal
					for key in ('identity.name', 'identity.auth_type'):
						session.pop(key, None)					
					# Tell Flask-Principal the user is anonymous
					identity_changed.send(current_app._get_current_object(),
								  identity = Identity(user.get_id()))
					response = makeJsonResponse({'msg': 'You have sucessfully logged in'})
					response.set_cookie('username', user.username)
					return response
				else:
					raise APIException('Incorrect password')
		elif (action == 'logout'):
			#if current_user.is_authenticated():
			logout_user()
			identity_changed.send(current_app._get_current_object(),
						  identity = AnonymousIdentity())
			response = makeJsonResponse({'msg': 'You have sucessfully logged out'})
			response.set_cookie('username', '')
			return response
#			else:
#				raise APIException('You are not logged in')
		else:
			raise APIException("Unknown action {}".format(action))
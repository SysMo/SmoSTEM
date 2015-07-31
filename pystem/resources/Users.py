'''
Created on Jul 14, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

from flask import request, session, current_app
from flask_mail import Message
from flask_login import UserMixin
from flask_login import login_user, logout_user, current_user
from flask_principal import Identity, AnonymousIdentity, identity_changed
from pystem.flask import bcrypt, db, mail

from StemResource import StemResource
from pystem.flask.Utilities import makeJsonResponse, parseJsonResponse
from pystem.Exceptions import APIException
import mongoengine.fields as F
from mongoengine.errors import DoesNotExist, NotUniqueError

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
	firstName = F.StringField(max_length = 50)
	lastName = F.StringField(max_length = 50)
	country = F.StringField(max_length = 50)
	organization = F.StringField(default = "")
	password = F.StringField(required = True)
	active = F.BooleanField(default = True)
	confirmed = F.BooleanField(default = False)
	roles = F.ListField(F.ReferenceField(Role), default=[])	
	
	def get_id(self):
		return str(self.id)

class UserAPI(StemResource):
	def initUsersDB(self):
		Role(name = 'admin', description = 'administrators').save()
		Role(name = 'user', description = 'users').save()
	
	# Redirects
	def get(self, action):
		if (action == "confirm"):
			return self.confirm()
		else:
			raise APIException("Unknown GET action {}".format(action))

	def post(self, action):
		if (action == 'create'):
			return self.create()
		elif (action == 'login'):
			return self.login()
		elif (action == 'logout'):
			return self.logout()
		else:
			raise APIException("Unknown POST action {}".format(action))
	
	# Actions
	def confirm(self):
		username = request.args['username']
		activationCode = request.args['activationCode']
		user = User.objects.get(username = username)
		if (user.confirmed):
			return "You have already confirmed your email"
		if (user is not None and str(user.id) == activationCode):
			user.confirmed = True
			user.save()
			return "Thank you, you can now login."
		else:
			raise APIException('Confirmation failed')		
		
	def create(self):
		# If no users exist, init the user DB
		if (User.objects.count() == 0):
			self.initUsersDB();
		userData = parseJsonResponse(request.data)
		if (len(userData[u'password']) < 6):
			raise APIException('Your password has to be at least 6 characters long')
		if (User.objects(username = userData['username']).count() > 0):
			raise APIException('User with this username already exists')
		if (User.objects(email = userData['email']).count() > 0):
			raise APIException('User with this email already exists')
		roleUser = Role.objects.get(name='user')
		user = User(
			username = userData['username'],
			email = userData['email'],
			firstName = userData['firstName'],
			lastName = userData['lastName'],
			country = userData['country'],
			organization = userData.get('organization', ''),
			password = unicode(bcrypt.generate_password_hash(userData[u'password'])),
			roles = [roleUser]
		)
		# If no users exist, init the user DB
		if (User.objects.count() == 0):
			user.roles.append(Role.objects.get(name='admin'))
		try:
			user.save()
			# Send email to the user
			msg = Message("Welcome to STEM", recipients = [user.email])
			msg.body = """\
Please click on the link to activate your profile
http://stem.sysmoltd.com/stem/api/Users/confirm&username={}&activationCode={}""".format(user.username, str(user.id))
			mail.send(msg)
			# Send email to admin
			msg = Message("New user registration", recipients = ["nasko.js@gmail.com"])
			msg.body = "username: {}\n email: {}\n".format(user.username, user.email)
			mail.send(msg)
		except NotUniqueError:
			raise APIException('Registration failed. Please contact the administrator stem@sysmoltd.com')
		return makeJsonResponse({
			'msg': 'Successfully created user {}'.format(user.username)
		})

	def login(self):
		userData = parseJsonResponse(request.data)
		if current_user.is_authenticated():
			return makeJsonResponse({'msg': 'You are already logged in'})
		else:
			try:
				user = User.objects.get(email = userData['id'])
			except DoesNotExist:
				raise APIException('User does not exist')
			if (not user.active):
				raise APIException('User has not been activated or has been deactivated. Please contact the administrator!')
			if (not user.confirmed):
				raise APIException('Your registration has not been confirmed. Please visit the link found in yout email!')
			passwordValid = bcrypt.check_password_hash(user.password, userData['password'])
			if (passwordValid):
				login_user(user)
				identity_changed.send(current_app._get_current_object(),
							  identity = Identity(user.get_id()))
				response = makeJsonResponse({'msg': 'You have sucessfully logged in'})
				response.set_cookie('user.username', user.username)
				response.set_cookie('user.roles', '-'.join([role.name for role in user.roles]))
				return response
			else:
				raise APIException('Incorrect password')

	def logout(self):
		logout_user()
		# Remove session keys set by Flask-Principal
		for key in ('identity.name', 'identity.auth_type'):
			session.pop(key, None)					
		# Tell Flask-Principal the user is anonymous
		identity_changed.send(current_app._get_current_object(),
					  identity = AnonymousIdentity())
		response = makeJsonResponse({'msg': 'You have sucessfully logged out'})
		response.set_cookie('user.username', '')
		response.set_cookie('user.roles', '')
		return response

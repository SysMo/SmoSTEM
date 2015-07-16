'''
Created on Jul 14, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

from flask import request, g
from flask_restful import Resource, abort
from bson.objectid import ObjectId
from mongokit import Document
from pystem.flask.Utilities import makeJsonResponse, parseJsonResponse
from StemResource import StemResource
from flask_login import UserMixin, login_required
from pystem.Exceptions import APIException
from flask import current_app
from flask_login import login_user, logout_user, current_user

bcrypt = None

class User(Document, UserMixin):
	__collection__ = "Users"
	use_dot_notation = True
	structure = {
		'username': unicode,
		'email': unicode,
		'fullName': unicode,
		'password': unicode,
		'active': bool
	}
	indexes = [
		{
			'fields': 'email',  # note: this may be an array
			'unique': True,	 	# only unique values are allowed 
		},
		{
			'fields': 'username',  # note: this may be an array
			'unique': True,	 	# only unique values are allowed 
		},
	]	#required_fields = ['username', 'email', 'fullName', 'password', 'active']
	
	def get_id(self):
		return self.username
	
class UserAPI(StemResource):
	def post(self):
		action = request.args.get('action', None)
		if (action is None):
			raise APIException("Parameter 'action' must be defined for POST method to Users resource")
		userData = parseJsonResponse(request.data)
		if (action == 'create'):
			userData[u'active'] = True
			userData[u'password'] = unicode(bcrypt.generate_password_hash(userData[u'password']))
			print userData
			user = self.conn.User(userData)
			user.save()
			return makeJsonResponse({
				'msg': 'Successfully created user {}'.format(user.username)
			})
		elif (action == 'login'):
			print current_user
			if current_user.is_authenticated():
				return makeJsonResponse({'msg': 'You are already logged in'})
			else:
				user = self.conn.User.one({'username': userData['username']})
				passwordValid = bcrypt.check_password_hash(user.password, userData['password'])
				if (passwordValid):
					login_user(user)
					return makeJsonResponse({'msg': 'You have sucessfully logged in'})
				else:
					raise APIException('Incorrect password')
		elif (action == 'logout'):
			logout_user()
			return makeJsonResponse({'msg': 'You have sucessfully logged out'})
		else:
			raise APIException("Unknown action {}".format(action))
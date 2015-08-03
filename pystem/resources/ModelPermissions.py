'''
Created on Jul 29, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

from collections import namedtuple
from functools import partial
from flask_login import current_user
from flask_principal import Permission, RoleNeed, UserNeed
from pystem.Exceptions import LoginRequiredError, UnauthorizedError
from pystem.flask import db, AnyUserNeed
import mongoengine.fields as F
import Users
import Models
from pystem.flask.Utilities import makeInvDict
from flask import request
import mongoengine
import mongoengine.fields as F
from pystem.flask import db
from StemResource import StemResource
from pystem.flask.Utilities import makeInvDict, makeJsonResponse
from pystem.Exceptions import APIException, UnauthorizedError
#### Database objects

class ModelUserAccess(db.Document):
	meta = {
		'collection': 'ModelUserAccess',		
		'indexes': [{'fields': ('user', 'model'), 'unique': True}]
	}	
	ACCESS = (
		(0, 'none'),
		(100, 'list'),
		(200, 'view'),
		(300, 'edit'),
		(400, 'full')
	)
	ACCESS_DCT = makeInvDict(ACCESS)
	user = F.ReferenceField(Users.User, required = True, 
			reverse_delete_rule=mongoengine.CASCADE)
	model = F.ReferenceField(Models.Model, required = True, 
			reverse_delete_rule=mongoengine.CASCADE)
	access = F.IntField(choices = ACCESS, default = 0)
	
#### API definitions

class ModelUserAccessAPI(StemResource):
	def checkPermissions(self, model):
		permission = ModelFullPermission(model)
		if (not permission.can()):
			raise UnauthorizedError('You have no permissions to change access to the model')
		
	def get(self, modelID = None):
		model = Models.Model.objects.get(id = modelID)
		self.checkPermissions(model)
		acl = ModelUserAccess.objects(model = model)
		accessList = []
		for accessEntry in acl:
			accessList.append({'username': accessEntry.user.username, 'access': accessEntry.access})
		return makeJsonResponse({'accessList': accessList, 'accesLevels': ModelUserAccess.ACCESS})
	
	def post(self, modelID, username):
		model = Models.Model.objects.get(id = modelID)
		self.checkPermissions(model)
		user = Users.User.objects.get(username = username)
		access = request.args.get('access', 'none')
		access = ModelUserAccess.ACCESS_DCT[access]
		accessEntry = ModelUserAccess(model = model, user = user, access = access)
		accessEntry.save()
		return makeJsonResponse(None, 'Success')
		#accessEntryQS = ModelUserAccess.objects(model = model, user = user)
		#if (accessEntryQS.count() > 0):
			
	def put(self, modelID, username):
		model = Models.Model.objects.get(id = modelID)
		self.checkPermissions(model)
		user = Users.User.objects.get(username = username)
		access = request.args.get('access', 'none')
		access = ModelUserAccess.ACCESS_DCT[access]
		accessEntry = ModelUserAccess.objects.get(model = model, user = user)
		accessEntry.modify(access = access)
		return makeJsonResponse(None, 'Success')
	
	def delete(self, modelID, username):
		model = Models.Model.objects.get(id = modelID)
		self.checkPermissions(model)
		user = Users.User.objects.get(username = username)
		accessEntry = ModelUserAccess.objects.get(model = model, user = user)
		accessEntry.delete()
		return makeJsonResponse(None, 'Success')

#### Permissions definitions

class ModelViewPermission(Permission):
	def __init__(self, model):
		needs = [UserNeed(model.owner.get_id()), RoleNeed('admin')]
		if (model.publicAccess >= Models.Model.PUBLIC_ACCESS_DCT['view']):
			needs.append(AnyUserNeed)
		else:
			userAccessList = ModelUserAccess.objects(model = model, access__gte = ModelUserAccess.ACCESS_DCT['view'])
			for accessEntry in userAccessList:
				needs.append(UserNeed(accessEntry.user.get_id())) 			
		super(ModelViewPermission, self).__init__(*needs)

class ModelEditPermission(Permission):
	def __init__(self, model):
		needs = [UserNeed(model.owner.get_id()), RoleNeed('admin')]
		if (model.publicAccess >= Models.Model.PUBLIC_ACCESS_DCT['edit']):
			needs.append(AnyUserNeed)
		else:
			userAccessList = ModelUserAccess.objects(model = model, access__gte = ModelUserAccess.ACCESS_DCT['edit'])
			for accessEntry in userAccessList:
				needs.append(UserNeed(accessEntry.user.get_id())) 
		super(ModelEditPermission, self).__init__(*needs)

class ModelFullPermission(Permission):
	def __init__(self, model):
		needs = [UserNeed(model.owner.get_id()), RoleNeed('admin')]
		userAccessList = ModelUserAccess.objects(model = model, access__gte = ModelUserAccess.ACCESS_DCT['full'])
		for accessEntry in userAccessList:
			needs.append(UserNeed(accessEntry.user.get_id())) 
		super(ModelFullPermission, self).__init__(*needs)


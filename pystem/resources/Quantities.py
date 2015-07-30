'''
Created on Jun 29, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

from flask import request
from bson.objectid import ObjectId
from pystem.flask.Utilities import makeJsonResponse, parseJsonResponse
from StemResource import StemResource
from pystem.Exceptions import APIException
from pystem.flask import db
import mongoengine.fields as F

#from mongokit import Document
# class Quantity(Document):
# 	__collection__ = "Quantities"
# 	use_dot_notation = True
# 	structure = {
# 		'name': unicode,
# 		'label': unicode,
# 		'SIUnit': unicode,
# 		'units': [(
# 			unicode, {
# 				'mult': float,
# 				'offset': float
# 			}
# 		)]
# 	}
# 	required_fields = ['name', 'SIUnit']
# 	default_values = {
# 		'name': u'<noname>',
# 		'label': u'',
# 		'SIUnit': u'<nounit>'
# 	}

class Quantity(db.Document):
	meta = {'collection': 'Quantities'}
	name = F.StringField(required=True, default = '<noname>')
	label = F.StringField()
	SIUnit = F.StringField(required=True, default = '<noname>')
	units = F.ListField()
	
class QuantityAPI(StemResource):
	def get(self, quantityID = None):
		"""
		Returns a model or a list of models
		"""
		if (quantityID is None):
			full = request.args.get('full', False)
			if (full):
				cursor = Quantity._get_collection().find(sort = [('name', 1)])
			else:
				cursor = Quantity._get_collection().find({}, {'name': True}, sort = [('name', 1)])
			return makeJsonResponse(list(cursor))
		else:
			quantity = Quantity._get_collection().find_one({'_id': quantityID})
			if (quantity is None):
				raise APIException("No quantity exists with ID {}".format(quantityID))
			return makeJsonResponse(quantity)
	
	def post(self):
		"""
		Create a new quantity
		"""
		quantity = Quantity()
		quantity.save()
		return makeJsonResponse({'_id': quantity.id}, 'Quantity created')
	
	def delete(self, quantityID):
		Quantity.objects.get(id = quantityID).delete()
		return makeJsonResponse(None, 'Quantity deleted')

	def put(self, quantityID):
		quantityData = parseJsonResponse(request.data)
		del quantityData['_id']
		quantity = Quantity.objects.get(id = quantityID)
		quantity.modify(**quantityData)
		quantity.save()
		return makeJsonResponse(None, 'Quantity saved')
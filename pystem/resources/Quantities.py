'''
Created on Jun 29, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

from flask import request
from bson.objectid import ObjectId
from mongokit import Document
from pystem.flask.Utilities import makeJsonResponse
from StemResource import StemResource
from pystem.Exceptions import APIException

class Quantity(Document):
	__collection__ = "Quantities"
	use_dot_notation = True
	structure = {
		'name': unicode,
		'label': unicode,
		'SIUnit': unicode,
		'units': [(
			unicode, {
				'mult': float,
				'offset': float
			}
		)]
	}
	required_fields = ['name', 'SIUnit']
	default_values = {
		'name': u'<noname>',
		'label': u'',
		'SIUnit': u'<nounit>'
	}

class QuantityAPI(StemResource):
	def get(self, quantityID = None):
		"""
		Returns a model or a list of models
		"""
		if (quantityID is None):
			full = request.args.get('full', False)
			if (full):
				cursor = self.conn.Quantity.find(sort = [('name', 1)])
			else:
				cursor = self.conn.Quantities.find({}, {'name': True}, sort = [('name', 1)])
			return makeJsonResponse(list(cursor))
		else:
			quantity = self.conn.Quantities.one({'_id': ObjectId(quantityID)})
			if (quantity is None):
				raise APIException("No quantity exists with ID {}".format(quantityID))
			return makeJsonResponse(quantity)
	
	def post(self):
		"""
		Create a new model
		"""
		quantity = self.conn.Quantity()
		quantity.validate()
		quantity.save()
		return makeJsonResponse({'_id': quantity._id})
	
	def delete(self, quantityID):
		self.conn.Quantities.remove({"_id": ObjectId(quantityID)})
		return {'status': 0}

	def put(self, quantityID):
		putData = request.json
		self.conn.Quantities.update(
			{'_id': ObjectId(quantityID)}, {
				'$set': {
					'name': putData.get('name'),
					'label': putData.get('label'),
					'SIUnit': putData.get('SIUnit'),
					'units': putData.get('units')
				}
			}, upsert = False
		)
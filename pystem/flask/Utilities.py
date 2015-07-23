'''
Created on Jun 19, 2015

@author: Atanas Pavlov
'''
import json
import datetime
from bson import ObjectId
from bson.json_util import SON, string_types, default 
from flask import Response
from astropy.units import dct
import math

def _default(obj):
	"""
	Custom conversion of BSON types
	"""
	if isinstance(obj, datetime.datetime):
		return obj.strftime("%Y-%m-%d %H:%M:%S")
	elif isinstance(obj, ObjectId):
		return str(obj)
	elif isinstance(obj, float):
		if (math.isnan(obj)):
			return '$float___nan'
		elif (math.isinf(obj)):
			if (obj > 0):
				return '$float___inf'
			else:
				return '$float___-inf'
		else:
			return obj
	else:
		return default(obj)
	
def _json_convert(obj):
	"""Recursive helper method that converts BSON types so they can be
	converted into json.
	"""
	if hasattr(obj, 'iteritems') or hasattr(obj, 'items'):  # PY3 support
		return SON(((k, _json_convert(v)) for k, v in obj.iteritems()))
	elif hasattr(obj, '__iter__') and not isinstance(obj, string_types):
		return list((_json_convert(v) for v in obj))
	try:
		return _default(obj)
	except TypeError:
		return obj

def listHook(lst):
	for i in range(len(lst)):
		value = lst[i]
		if (isinstance(value, basestring) and value.startswith('$float___')):
			lst[i] = float(value[len('$float___'):])
		elif (isinstance (value, list)):
			listHook(value)
		

def objHook(dct):
	"""
	Transformation of json object on deserialization
	"""
	for key, value in dct.iteritems():
		if (isinstance(value, basestring) and value.startswith('$float___')):
			dct[key] = float(value[len('$float___'):])
		elif (isinstance (value, list)):
			listHook(value)
	return dct

def makeJsonResponse(data, msg = ''):
	"""Convert Mongo object(s) to JSON"""
	response = Response(json.dumps(_json_convert(data)), content_type='application/json')
	response.headers['X-status-msg'] = msg
	return response

def parseJsonResponse(data):
	"""Convert JSON to Mongo object(s)"""
	dct = json.loads(data, object_hook = objHook)
	if ('_id' in dct):
		dct['_id'] = ObjectId(dct['_id'])
	return dct

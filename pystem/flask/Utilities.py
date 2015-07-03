'''
Created on Jun 19, 2015

@author: Atanas Pavlov
'''
from bson import json_util
from flask import Response


def jsonResponse(data):
	"""Convert Mongo object(s) to JSON"""
	return Response(json_util.dumps(data), content_type='application/json')

# # Register a RESTful API
# def registerAPI(app, view, endpoint, url, pk, pk_type='string'):
# 	"""Utility function to register RESTful API"""
# 	view_func = view.as_view(endpoint)
# 	app.add_url_rule(url, defaults={pk: None},
# 					 view_func=view_func, methods=['GET',])
# 	app.add_url_rule(url, defaults={pk: None},
# 					view_func=view_func, methods=['POST',])
# 	app.add_url_rule('%s/<%s:%s>' % (url, pk_type, pk), view_func=view_func,
# 					 methods=['GET', 'PUT', 'DELETE', 'POST'])

# Send JSON response on errors
# def make_json_error(ex):
# 	response = jsonify(message=str(ex))
# 	response.status_code = (ex.code
# 							if isinstance(ex, HTTPException)
# 							else 500)
# 	return response
# 
# for code in default_exceptions.iterkeys():
# 	app.error_handler_spec[None][code] = make_json_error

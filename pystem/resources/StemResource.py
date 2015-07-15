'''
Created on Jul 15, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd.
'''

from flask_restful import Resource
from pystem.Exceptions import APIExceptionDecorator

class StemResource(Resource):
	decorators = [APIExceptionDecorator]
	def __init__(self, conn):
		self.conn = conn
		

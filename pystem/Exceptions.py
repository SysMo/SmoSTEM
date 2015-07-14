'''
Created on Jul 2, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''
import sys, traceback

class APIException(Exception):
	status_code = 500

class FieldError(APIException):
	pass

class SemanticError(APIException):
	def __init__(self, msg, node):
		fullMsg = msg + ";\n line {}, column offset {}".format(node.lineno, node.col_offset)
		super(SemanticError, self).__init__(fullMsg)

class EvaluationError(APIException):
	def __init__(self, msg, node):
		fullMsg = str(msg) + ";\n line {}, column offset {}".format(node.lineno, node.col_offset)
		super(EvaluationError, self).__init__(fullMsg)

class AssignmentError(APIException):
	def __init__(self, msg, node):
		fullMsg = str(msg) + ";\n line {}, column offset {}".format(node.lineno, node.col_offset)
		super(AssignmentError, self).__init__(fullMsg)

class NonAPIException(Exception):
	status_code = 500
	def __init__(self, e):
		self.excType = sys.exc_info()[0].__name__
		self.traceback = traceback.format_exc()
		super(NonAPIException, self).__init__(str(e))

class APIExceptionDecorator(object):
	def __init__(self, method):
		self.method = method
		
	def __call__(self, *args, **kwargs):
		try:
			return self.method(*args, **kwargs)
		except APIException, e:
			raise
		except Exception, e:
			raise NonAPIException(e)	
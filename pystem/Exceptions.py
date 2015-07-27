'''
Created on Jul 2, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''
import sys, traceback
from flask_principal import PermissionDenied

class APIException(Exception):
	status_code = 500
	def __init__(self, e):
		super(APIException, self).__init__(str(e))

class FieldError(APIException):
	def __init__(self, msg, sectionName, fieldName):
		fullMsg = str(msg) + "\nSection '{}', block '{}' \n".format(
				sectionName, fieldName)
		super(FieldError, self).__init__(fullMsg)


class FormulaError(APIException):
	def __init__(self, msg, node, formulaBlock):
		fullMsg = str(msg) + "\nsection '{}', block '{}' \nline '{}', column offset '{}'".format(
				formulaBlock.sectionName, formulaBlock.blockName, node.lineno, node.col_offset)
		super(FormulaError, self).__init__(fullMsg)

class SemanticError(FormulaError):
	pass

class AssignmentError(FormulaError):
	pass

class LoginRequiredError(APIException):
	def __init__(self, msg =''):
		fullMsg = "You have to be logged in order to perform this action.\n{}".format(msg)
		super(LoginRequiredError, self).__init__(fullMsg)
		
class UnauthorizedError(APIException):
	def __init__(self, msg = ''):
		fullMsg = "You are not authorized to perform this action.\n{}".format(msg)
		super(UnauthorizedError, self).__init__(fullMsg)

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
		except PermissionDenied, e:
			raise UnauthorizedError()
		except APIException, e:
			raise
		except Exception, e:
			raise NonAPIException(e)	
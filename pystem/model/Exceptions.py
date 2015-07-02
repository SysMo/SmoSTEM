'''
Created on Jul 2, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''

class FieldError(Exception):
	pass

class SemanticError(Exception):
	def __init__(self, msg, node):
		fullMsg = msg + ";\n line {}, column offset {}".format(node.lineno, node.col_offset)
		super(SemanticError, self).__init__(fullMsg)

class EvaluationError(Exception):
	def __init__(self, msg, node):
		fullMsg = str(msg) + ";\n line {}, column offset {}".format(node.lineno, node.col_offset)
		super(EvaluationError, self).__init__(fullMsg)

class AssignmentError(Exception):
	def __init__(self, msg, node):
		fullMsg = str(msg) + ";\n line {}, column offset {}".format(node.lineno, node.col_offset)
		super(AssignmentError, self).__init__(fullMsg)

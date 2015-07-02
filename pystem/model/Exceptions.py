'''
Created on Jul 2, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''

class SemanticError(Exception):
	def __init__(self, msg, node):
		fullMsg = msg + ";\n line {}, column offset {}".format(node.lineno, node.col_offset)
		super(SemanticError, self).__init__(fullMsg)

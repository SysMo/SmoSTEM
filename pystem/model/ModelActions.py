'''
Created on Jun 27, 2015

@author: Atanas Pavlov
'''
from __future__ import division
import ast
import numpy as np
import math

class SemanticError(Exception):
	def __init__(self, msg, node):
		fullMsg = msg + "\n At line {}, column offset {}".format(node.lineno, node.col_offset)
		super(SemanticError, self).__init__(fullMsg)

class FunctionRegistry(object):
	def __init__(self):
		self.funcs = {}
		self.addMathModuleFunctions()
	
	def addMathModuleFunctions(self):
		mathFuncs = {
			'abs': np.fabs,
			'exp': np.exp,
			'log': np.log,
			'pow': np.power,
			'sqrt': np.sqrt,
			'sin': np.sin,
			'cos': np.cos,
			'tan': np.tan,
			'sinh': np.sinh,
			'cosh': np.cosh,
			'tanh': np.tanh,
			
			'sum': np.sum,
			'prod': np.prod,
		}
		self.funcs.update(mathFuncs)

class Field(object):
	def __init__(self, jsonField):
		self.jsonField = jsonField
		self.name = jsonField['name']
		self.type = jsonField['type']
		if (self.type == 'stem.TableField'):
			self.dtype = [(str(column['name']), np.float) for column in jsonField['columns']]
			
				
	def parseValue(self, jValue):
		if (self.type == 'stem.ScalarField'):
			value = float(jValue)
		elif (self.type == 'stem.TableField'):
			value = np.recarray(shape = len(jValue), dtype = self.dtype)
			for i in range(len(jValue)):
				value[i] = tuple(jValue[i])
		return value
	
	def serializeValue(self, value):
		if (self.type == 'stem.ScalarField'):
			jValue = value
		elif (self.type == 'stem.TableField'):
			jValue = [list(row) for row in value]
		return jValue
	
	def __str__(self):
		res = "{}:{} = {}".format(self.name, self.type)
		return res
		
class ExpressionEvaluator(object):
	def __init__(self, exprNode, ctx, funcRegistry):
		
		self.exprNode = exprNode
		self.ctx = ctx
		self.funcRegistry = funcRegistry
		
	def eval(self):
		result = self.evalExpr(self.exprNode.body)
		return result
	
	def evalExpr(self, expr):
		if(isinstance(expr, ast.Num)):
			return expr.n
		elif (isinstance(expr, (ast.Name, ast.Attribute, ast.Slice))):
			return self.evalVariable(expr)
		elif (isinstance(expr, ast.BinOp)):
			left = expr.left
			right = expr.right
			op = expr.op
			if (isinstance(op, ast.Add)):
				return self.evalExpr(left) + self.evalExpr(right)
			elif (isinstance(op, ast.Sub)):
				return self.evalExpr(left) - self.evalExpr(right)
			elif (isinstance(op, ast.Mult)):
				return self.evalExpr(left) * self.evalExpr(right)
			elif (isinstance(op, ast.Div)):
				return self.evalExpr(left) / self.evalExpr(right)
			elif (isinstance(op, ast.Pow)):
				return self.evalExpr(left) ** self.evalExpr(right)
			else:
				raise TypeError("Illegal binary operation")
		elif(isinstance(expr, ast.UnaryOp)):
			op = expr.op
			operand = expr.operand
			if (isinstance(op, ast.Invert)):
				return ~operand
			elif (isinstance(op, ast.Not)):
				return not operand
			elif (isinstance(op, ast.UAdd)):
				return +operand
			elif (isinstance(op, ast.USub)):
				return -operand
			else:
				raise TypeError("Illegal unary operation")
		elif(isinstance(expr, ast.List)):
			return [self.evalExpr(el) for el in expr.elts]
		elif(isinstance(expr, ast.Call)):
			return self.evalFuncCall(expr)
		else:
			raise SemanticError("Illegal expression {}".format(ast.dump(expr)), expr)
	
	def evalVariable(self, varNode):
		if isinstance(varNode, ast.Name):
			return self.ctx[varNode.id]
		elif isinstance(varNode, ast.Attribute):
			attrName = varNode.attr
			if (attrName[0] == '_'):
				raise ValueError('Attribute names cannot start with _ (underscore)')
			return getattr(self.evalVariable(varNode.value), attrName)
		elif isinstance(varNode, ast.Slice):
			slice = varNode.slice
			if (isinstance(slice, ast.Index) and isinstance(slice.value, ast.Num)):
				index = slice.value.n
			else:
				raise TypeError("Only integer indices are supported")
			return self.evalVariable(varNode.value)[index]
		
	def evalFuncCall(self, funcCallNode):
		print ast.dump(funcCallNode)
		funcPNode = funcCallNode.func
		if (isinstance(funcPNode, ast.Name)):
			funcName = funcCallNode.func.id
			if (funcName in self.funcRegistry.funcs):
				func = self.funcRegistry.funcs[funcName]
			else:
				raise SemanticError("No function {} defined".format(funcName), funcCallNode)
		elif (isinstance(funcPNode, ast.Attribute)):
			func = self.evalExpr(funcPNode)
		fArgs = [self.evalExpr(argExpr) for argExpr in funcCallNode.args]
		fKeywordArgs = {kwargExpr.arg: self.evalExpr(kwargExpr.value)for kwargExpr in funcCallNode.keywords}
		funcResult = func(*fArgs, **fKeywordArgs)
		return funcResult
	
class FormulaBlockProcessor(object):
	def __init__(self, formulas, fields, values):
		blockAST = ast.parse(formulas)
		assert isinstance(blockAST, ast.Module)
		self.statements = blockAST.body
		self.fields = fields
		self.ctx = values
		self.funcRegistry = FunctionRegistry()
		
	def process(self):
		for statement in self.statements:
			assert isinstance(statement, ast.Assign)
			expr = ast.Expression(body = statement.value)
			#print ast.dump(statement)
			ee = ExpressionEvaluator(expr, self.ctx, self.funcRegistry)
			result = ee.eval()
			for targetNode in statement.targets:
				self.assignValue(value = result, targetNode = targetNode)
	
	def assignValue(self, value, targetNode, topLevel = True):
		if (isinstance(targetNode, ast.Name)):
			varName = targetNode.id
			if (topLevel):
				self.ctx[varName] = value
			else:
				return self.ctx[varName]
		elif (isinstance(targetNode, ast.Attribute)):
			attrName = targetNode.attr
			if (attrName[0] == '_'):
				raise ValueError('Attribute names cannot start with _ (underscore)')
			targetContainer = self.assignValue(value, targetNode.value, False)
			if (topLevel):
				setattr(targetContainer, attrName, value)
			else:
				return getattr(targetContainer, attrName)
		elif (isinstance(targetNode, ast.Subscript)):
			slice = targetNode.slice
			if (isinstance(slice, ast.Index) and isinstance(slice.value, ast.Num)):
				index = slice.value.n
			else:
				raise TypeError("Only integer indices are supported")
			targetContainer = self.assignValue(value, targetNode.value, False)
			if (topLevel):
				targetContainer[index] = value
			else:
				return targetContainer[index]			
		else:
			print targetNode
			raise TypeError("Assignment target must be variable, variable attribute or variable index") 
	
# 	def assignValue_Attribute(self):
# 		pass
# 	
# 	def assignValue_Subscript(self):
# 		pass

class ModelActionExecutor(object):
	def __init__(self, modelData):
		self.modelData = modelData

	def execute(self, action):
		if (action == 'compute'):
			self.compute()
		
	def compute(self):
		self.preCompute()
		for fp in self.formulaProcessors:
			fp.process()
		self.postCompute()
		
	def preCompute(self):
		self.fields = {}
		self.fieldValues = {}
		self.formulaProcessors = []
		for block in self.modelData['board']['layouts']:
			if (block['type'] == 'grid'):
				for field in block['fields']:
					fieldName = field['name']
					if (fieldName in self.fields):
						raise KeyError('Duplicate field "{}"'.format(fieldName))
					pField = Field(field)
					self.fields[fieldName] = pField					 
					self.fieldValues[fieldName] = pField.parseValue(field['value'])
			elif (block['type'] == 'formulas'):
				for field in block['fields']:					
					fbp = FormulaBlockProcessor(field['value'], self.fields, self.fieldValues)
					self.formulaProcessors.append(fbp)
					
	def postCompute(self):				
		for block in self.modelData['board']['layouts']:
			if (block['type'] == 'grid'):
				for field in block['fields']:
					fieldName = field['name']
					field['value'] = self.fields[fieldName].serializeValue(self.fieldValues[fieldName])
					

'''
Created on Jul 2, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''
from __future__ import division
import ast
from FunctionRegistry import FunctionRegistry
import pystem.Exceptions as E

class ExpressionEvaluator(object):
	def __init__(self, ctx, funcRegistry):	
		self.ctx = ctx
		self.funcRegistry = funcRegistry
		
	def eval(self, expr):
		try:
			result = self.evalExpr(expr)
			return result
		except Exception, e:
			raise E.EvaluationError(e, expr)
	
	def evalExpr(self, expr):
		if(isinstance(expr, ast.Num)):
			result = expr.n
		elif (isinstance(expr, (ast.Name, ast.Attribute, ast.Subscript))):
			result = self.evalVariable(expr)
		elif (isinstance(expr, ast.BinOp)):
			result = self.evalBinarOp(expr)
		elif(isinstance(expr, ast.UnaryOp)):
			result = self.evalUnaryOp(expr)
		elif(isinstance(expr, ast.IfExp)):
			if self.evalCompare(expr.test):
				result = self.evalExpr(expr.body)
			else:
				result = self.evalExpr(expr.orelse)
		elif(isinstance(expr, ast.Compare)):
			result = self.evalCompare(expr)
		elif(isinstance(expr, ast.List)):
			result =  [self.evalExpr(el) for el in expr.elts]
		elif(isinstance(expr, ast.Call)):
			result = self.evalFuncCall(expr)
		else:
			raise E.SemanticError("Illegal expression {}".format(ast.dump(expr)), expr)
		return result
	
	binaryOps = {
		ast.Add: lambda a,b: a + b,
		ast.Sub: lambda a,b: a - b,
		ast.Mult: lambda a,b: a * b,
		ast.Div: lambda a,b: a / b,
		ast.Pow: lambda a,b: a**b,
	}
	def evalBinarOp(self, opNode):
		"""
		Evaluates binary operation		
		
		BinOp(expr left, operator op, expr right)
		operator = Add | Sub | Mult | Div | Mod | Pow | LShift 
                 | RShift | BitOr | BitXor | BitAnd | FloorDiv                 
		"""
		left = self.evalExpr(opNode.left)
		right = self.evalExpr(opNode.right)
		opFunc = self.binaryOps.get(opNode.op.__class__)
		if (opFunc is None):
			raise E.SemanticError("Illegal binary operation", opNode)
		return opFunc(left, right)
	
	unaryOps = {
		#ast.Invert: lambda a: ~a,
		#ast.Not: lambda a: not a,
		#ast.UAdd: lambda a: +a,
		ast.USub: lambda a: -a,
	}
	def evalUnaryOp(self, opNode):
		"""
		Evaluates unary operation
		
		UnaryOp(unaryop op, expr operand)
		unaryop = Invert | Not | UAdd | USub
		"""
		operand = self.evalExpr(opNode.operand)
		opFunc = self.unaryOps.get(opNode.op.__class__)
		if (opFunc is None):
			raise E.SemanticError("Illegal unary operation", opNode)
		return opFunc(operand)
	
	cmpOps = {
		ast.Eq: lambda a, b: a == b,
		ast.NotEq: lambda a, b: a != b,
		ast.Lt: lambda a, b: a < b,
		ast.LtE: lambda a, b: a <= b,
		ast.Gt: lambda a, b: a > b,
		ast.GtE: lambda a, b: a >= b,
		ast.Is: lambda a, b: a is b,
		ast.IsNot: lambda a, b: a is not b,
		ast.In: lambda a, b: a in b,
		ast.NotIn: lambda a, b: a not in b
	}
	def evalCompare(self, cmpNode):
		"""
		Evaluates comparison operator
		
		Compare(expr left, cmpop* ops, expr* comparators)
		# cmpop = Eq | NotEq | Lt | LtE | Gt | GtE | Is | IsNot | In | NotIn
		"""
		if len(cmpNode.ops) > 1:
			raise E.SemanticError("Cannot use chained compare operators", cmpNode)
		left = self.evalExpr(cmpNode.left)
		right = self.evalExpr(cmpNode.comparators[0])
		cmpFunc = self.cmpOps.get(cmpNode.ops[0].__class__)
		if (cmpFunc is None):
			raise E.SemanticError("Illegal comparison operation", cmpNode)
		return cmpFunc(left, right)
	
	def evalVariable(self, varNode):
		"""
		Evaluates a variable, which can have attributes and indices
		
		Name(identifier id, expr_context ctx)
		Attribute(expr value, identifier attr, expr_context ctx)
		Subscript(expr value, slice slice, expr_context ctx)
		"""
		if isinstance(varNode, ast.Name):
			return self.ctx[varNode.id]
		elif isinstance(varNode, ast.Attribute):
			attrName = varNode.attr
			if (attrName[0] == '_'):
				raise E.SemanticError('Attribute names cannot start with _ (underscore)')
			return getattr(self.evalVariable(varNode.value), attrName)
		elif isinstance(varNode, ast.Subscript):
			slice = varNode.slice
			if (isinstance(slice, ast.Index) and isinstance(slice.value, ast.Num)):
				index = slice.value.n
			else:
				raise E.SemanticError("Only integer indices are supported")
			return self.evalVariable(varNode.value)[index]
		
	def evalFuncCall(self, funcCallNode):
		funcPNode = funcCallNode.func
		if (isinstance(funcPNode, ast.Name)):
			funcName = funcCallNode.func.id
			if (funcName in self.funcRegistry.funcs):
				func = self.funcRegistry.funcs[funcName]
			else:
				raise E.SemanticError("No function {} defined".format(funcName), funcCallNode)
		elif (isinstance(funcPNode, ast.Attribute)):
			func = self.evalExpr(funcPNode)
		fArgs = [self.evalExpr(argExpr) for argExpr in funcCallNode.args]
		fKeywordArgs = {kwargExpr.arg: self.evalExpr(kwargExpr.value)for kwargExpr in funcCallNode.keywords}
		funcResult = func(*fArgs, **fKeywordArgs)
		return funcResult
	
class FormulaBlockProcessor(object):
	def __init__(self, scope):
		self.scope = scope
		self.blocks = []
		
	def addBlock(self, name, content):
		"""
		Root node of ast.parse result:
		Module(stmt* body)
		"""
		blockAST = ast.parse(content, filename = name)
		self.blocks.append(blockAST)
		
	def process(self):
		ee = ExpressionEvaluator(self.scope)
		for block in self.blocks:
			for statement in block.body:
				if isinstance(statement, ast.Assign):
					# Assign(expr* targets, expr value)
					value = ee.eval(statement.value)
					try:
						for targetNode in statement.targets:
							self.assignValue(value = value, targetNode = targetNode)
					except Exception, e:
						raise E.AssignmentError(e, statement)
				else:
					raise E.SemanticError("The statement is not an assignment", statement)
	
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
				raise E.SemanticError('Attribute names cannot start with _ (underscore)', targetNode)
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
				raise E.SemanticError("Only integer indices are supported", targetNode)
			targetContainer = self.assignValue(value, targetNode.value, False)
			if (topLevel):
				targetContainer[index] = value
			else:
				return targetContainer[index]			
		else:
			raise E.SemanticError("Assignment target must be variable, variable attribute or variable index", targetNode) 
	
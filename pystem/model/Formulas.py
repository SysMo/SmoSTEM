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
from pystem.model.Scope import UndefinedSymbolError
from flask import current_app
from pystem.Exceptions import FormulaError

class ExpressionEvaluator(object):
	def __init__(self, scope):	
		self.scope = scope
	
	def setFormulaBlock(self, formulaBlock):
		self.formulaBlock = formulaBlock
				
	def eval(self, expr):
# 		try:
		result = self.evalExpr(expr)
		return result
# 		except E.FormulaError:
# 			raise
# # 		except Exception, e:
# 			raise E.FormulaError(e, expr, self.formulaBlock)
	
	def evalExpr(self, expr):
		if(isinstance(expr, ast.Num)):
			result = expr.n
		elif(isinstance(expr, ast.Str)):
			result = expr.s
		elif (isinstance(expr, (ast.Name, ast.Attribute, ast.Subscript))):
			result = self.evalVariable(expr)
		elif (isinstance(expr, ast.BinOp)):
			result = self.evalBinarOp(expr)
		elif(isinstance(expr, ast.UnaryOp)):
			result = self.evalUnaryOp(expr)
		elif(isinstance(expr, ast.IfExp)):
			if self.evalExpr(expr.test):
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
			raise E.SemanticError("Illegal expression {}".format(ast.dump(expr)), expr, self.formulaBlock)
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
			raise E.SemanticError("Illegal binary operation", opNode, self.formulaBlock)
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
			raise E.SemanticError("Illegal unary operation", opNode, self.formulaBlock)
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
			raise E.SemanticError("Cannot use chained compare operators", cmpNode, self.formulaBlock)
		left = self.evalExpr(cmpNode.left)
		right = self.evalExpr(cmpNode.comparators[0])
		cmpFunc = self.cmpOps.get(cmpNode.ops[0].__class__)
		if (cmpFunc is None):
			raise E.SemanticError("Illegal comparison operation", cmpNode, self.formulaBlock)
		return cmpFunc(left, right)
	
	def evalVariable(self, varNode):
		"""
		Evaluates a variable, which can have attributes and indices
		
		Name(identifier id, expr_context ctx)
		Attribute(expr value, identifier attr, expr_context ctx)
		Subscript(expr value, slice slice, expr_context ctx)
		"""
		if isinstance(varNode, ast.Name):
			return self.scope.getSymbolValue(varNode.id, searchImports = True)
		elif isinstance(varNode, ast.Attribute):
			attrName = varNode.attr
			if (attrName[0] == '_'):
				raise E.SemanticError('Attribute names cannot start with _ (underscore)', varNode, self.formulaBlock)
			return getattr(self.evalVariable(varNode.value), attrName)
		elif isinstance(varNode, ast.Subscript):
			slice = varNode.slice
			if (isinstance(slice, ast.Index) and isinstance(slice.value, ast.Num)):
				index = slice.value.n
			else:
				raise E.SemanticError("Only integer indices are supported", varNode, self.formulaBlock)
			return self.evalVariable(varNode.value)[index]
		
	def evalFuncCall(self, funcCallNode):
		funcPNode = funcCallNode.func
		if (isinstance(funcPNode, ast.Name)):
			funcName = funcCallNode.func.id
			try:
				func = self.scope.getSymbolValue(funcName, searchImports = True)
			except UndefinedSymbolError, e:
				raise E.SemanticError("No function {} defined".format(funcName), funcCallNode, self.formulaBlock)
		elif (isinstance(funcPNode, ast.Attribute)):
			func = self.evalExpr(funcPNode)
		fArgs = [self.evalExpr(argExpr) for argExpr in funcCallNode.args]
		fKeywordArgs = {kwargExpr.arg: self.evalExpr(kwargExpr.value)for kwargExpr in funcCallNode.keywords}
		funcResult = func(*fArgs, **fKeywordArgs)
		return funcResult
	
class FormulaBlockProcessor(object):
	def __init__(self, scope):
		self.scope = scope
		
	def process(self):
		ee = ExpressionEvaluator(self.scope)
		for block in self.scope.formulaBlocks:
			self.currentFormulaBlock = block
			ee.setFormulaBlock(self.currentFormulaBlock)
			self.processStatementBlock(block.ast.body, self.scope, ee)
	
	def processStatementBlock(self, block, scope, ee):
		for statement in block:
			if isinstance(statement, ast.Assign):
				# Assign(expr* targets, expr value)
				value = ee.eval(statement.value)
				try:
					for targetNode in statement.targets:
						self.assignValue(value = value, targetNode = targetNode, scope = scope)
				except Exception, e:
					raise E.AssignmentError(e, statement, self.currentFormulaBlock)
			elif isinstance(statement, ast.AugAssign):
				# AugAssign(expr target, operator op, expr value)
				targetNode = statement.target
				value = ee.eval(targetNode)
				opValue = ee.eval(statement.value)
				op = statement.op
				if (isinstance(op, ast.Add)):
					value += opValue
				elif (isinstance(op, ast.Sub)):
					value += opValue
				elif (isinstance(op, ast.Mult)):
					value += opValue
				elif (isinstance(op, ast.Div)):
					value += opValue
				else:
					raise  E.SemanticError("Illegal augmented operation", statement, self.currentFormulaBlock)
				self.assignValue(value = value, targetNode = targetNode, scope = scope)
			elif isinstance(statement, ast.For):
				# For(expr target, expr iter, stmt* body, stmt* orelse)
				if len(statement.orelse) > 0:
					raise E.SemanticError("Else clauses in loops not supported", statement, self.currentFormulaBlock)
				target, it, body = statement.target, statement.iter, statement.body
				localScope = scope.createChildScope()
				localEE = ExpressionEvaluator(localScope)
				localEE.setFormulaBlock(self.currentFormulaBlock)
				itValue = ee.eval(it)
				for val in itValue:
					localScope.setSymbolValue(target.id, val)
					self.processStatementBlock(body, localScope, localEE)
				localScope.release()
			elif isinstance(statement, ast.While):
				# While(expr test, stmt* body, stmt* orelse)
				if len(statement.orelse) > 0:
					raise E.SemanticError("Else clauses in loops not supported", statement, block)
				test, body = statement.test, statement.body
				localScope = scope.createChildScope()
				localEE = ExpressionEvaluator(localScope)
				localEE.setFormulaBlock(self.currentFormulaBlock)
				loopCounter = 0
				iterationLimit = current_app.config['LIMITS_MAX_N_LOOPS']
				while localEE.eval(test):
					if (loopCounter > iterationLimit):
						raise FormulaError("A 'while' loop exceeded the iteration limit {}".format(iterationLimit), statement, self.currentFormulaBlock)
					else:
						loopCounter += 1
					self.processStatementBlock(body, localScope, localEE)
				localScope.release()
			else:
				raise E.SemanticError("The statement is not an assignment or loop", statement, self.currentFormulaBlock)
	
	def assignValue(self, value, targetNode, scope, topLevel = True):
		if (isinstance(targetNode, ast.Name)):
			varName = targetNode.id
			if (topLevel):
				scope.setSymbolValue(varName, value)
			else:
				return scope.getSymbolValue(varName, searchImports = False)
		elif (isinstance(targetNode, ast.Attribute)):
			attrName = targetNode.attr
			if (attrName[0] == '_'):
				raise E.SemanticError('Attribute names cannot start with _ (underscore)', targetNode, self.formulaBlock)
			targetContainer = self.assignValue(value, targetNode.value, scope, False)
			if (topLevel):
				setattr(targetContainer, attrName, value)
			else:
				return getattr(targetContainer, attrName)
		elif (isinstance(targetNode, ast.Subscript)):
			slice = targetNode.slice
			if (isinstance(slice, ast.Index) and isinstance(slice.value, ast.Num)):
				index = slice.value.n
			else:
				raise E.SemanticError("Only integer indices are supported", targetNode, self.formulaBlock)
			targetContainer = self.assignValue(value, targetNode.value, scope, False)
			if (topLevel):
				targetContainer[index] = value
			else:
				return targetContainer[index]			
		else:
			raise E.SemanticError("Assignment target must be variable, variable attribute or variable index", targetNode, self.formulaBlock) 
	

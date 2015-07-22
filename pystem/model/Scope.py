import json
import importlib
import types
import numpy as np
from pystem.Exceptions import SemanticError

class ScopeEncoder(json.JSONEncoder):
	def default(self, obj):
		if isinstance(obj, Scope):
			dct = {'symbols' : obj.symbols, 'children' : obj.children}
			if (hasattr(obj, 'imports')):
				dct['imports'] = getattr(obj, 'imports')
			return dct
		elif isinstance(obj, (types.FunctionType, types.LambdaType, np.ufunc)):
			return obj.__name__
		else:
			return json.JSONEncoder.default(self, obj)

class UndefinedSymbolError(Exception):
	pass

class Scope(object):
	def __init__(self, parent = None, symbols = None):
		self.children = []
		self.parent = parent
		self.symbols = symbols or {}
		self.statementBlocks = []
		
	def createChildScope(self, symbols = None):
		child = Scope(self, symbols)
		self.children.append(child)
		return child
		
	def getSymbolValue(self, name):
		if (name in self.symbols.keys()):
			return self.symbols[name]
		elif (self.parent is not None):
			return self.parent.getSymbolValue(name)
		else:
			pass
		
	def setSymbolValue(self, name, value):
		self.symbols[name] = value
		
	def addSymbols(self, dct):
		self.symbols.update(dct)

	def addStatementBlock(self, block):
		self.statementBlocks.append(block)

class RootScope(Scope):
	def __init__(self):
		super(RootScope, self).__init__()
		self.imports = {}
		
	def getSymbolValue(self, name):
		if (name in self.symbols.keys()):
			return self.symbols[name]
		elif (name in self.imports):
			return self.imports[name]
		else:
			raise UndefinedSymbolError("Symbol {} not found".format(name))
		
	def importModule(self, qualifiedName, importName, symbols):
		module = importlib.import_module(qualifiedName)
		if (importName is None) or (len(importName) == 0):
			for symbol in symbols:
				self.imports[symbol] = getattr(module, symbol)   
		else:
			self.imports[importName] = {}
			for symbol in symbols:
				self.imports[importName][symbol] = getattr(module, symbol)
				

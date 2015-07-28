import json
import importlib
import types
import numpy as np
import ast
from pystem.Exceptions import SemanticError, APIException
from pystem.resources.LibraryModules import LibraryModule

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
class SymbolCollisionError(Exception):
	pass

class FormulaBlock(object):
	def __init__(self, sectionName, blockName, formulas):
		self.sectionName = sectionName
		self.blockName = blockName
		#try:
		self.ast = ast.parse(formulas)		
		#except Exception, e:
		#	raise APIException(u"Failed to parse the formulas\nsection: {}, formula block: {}\n".format(sectionName, blockName) + unicode(e))

class Scope(object):
	def __init__(self, parent = None, symbols = None):
		self.children = []
		self.parent = parent
		self.symbols = symbols or {}
		self.fields = {}
		self.formulaBlocks = []
	
	def release(self):
		self.parent.children.remove(self)
	
	def createChildScope(self, symbols = None):
		child = Scope(self, symbols)
		self.children.append(child)
		return child
		
	def getSymbolValue(self, name, searchImports = False):
		if (name in self.symbols.keys()):
			return self.symbols[name]
		elif (self.parent is not None):
			return self.parent.getSymbolValue(name, searchImports)
		else:
			pass
		
	def setSymbolValue(self, name, value):
		# TODO: perhaps first we have to check if the symbol exists in outer scopes
		self.symbols[name] = value
		
	def addSymbols(self, dct):
		self.symbols.update(dct)

	def addFormulaBlock(self, sectionName, blockName, statements):
		self.formulaBlocks.append(FormulaBlock(
					sectionName, blockName, statements))

class RootScope(Scope):
	def __init__(self):
		super(RootScope, self).__init__()
		self.imports = {}
		self.setSymbolValue('True', True)
		self.setSymbolValue('False', False)
		#self.importModule('pystem.modules.Standard', '', ['sin', 'cos', 'tan', 'pi', 'PI'])
		self.importLibraryModules()
		
	def importLibraryModules(self):
		modules = LibraryModule.objects()
		for module in modules:
			self.importModule(module.importPath, module.importName, [function.name for function in module.functions])
		
	def getSymbolValue(self, name, searchImports = False):
		if (name in self.symbols.keys()):
			return self.symbols[name]
		elif (searchImports and name in self.imports.keys()):
			return self.imports[name]
		else:
			raise UndefinedSymbolError("Symbol {} not found".format(name))

	def setSymbolValue(self, name, value):
		if (name in self.imports.keys()):
			raise SymbolCollisionError("Symbol {} is import and cannot be assigned to".format(name))
		self.symbols[name] = value
				
	def importModule(self, qualifiedName, importName, symbols):
		module = importlib.import_module(qualifiedName)
		if (importName is None) or (len(importName) == 0):
			for symbol in symbols:
				self.imports[symbol] = getattr(module, symbol)   
		else:
			self.imports[importName] = {}
			for symbol in symbols:
				self.imports[importName][symbol] = getattr(module, symbol)
				

'''
Created on Jun 27, 2015

@author: Atanas Pavlov
'''
import itertools, json
import numpy as np
from Formulas import FormulaBlockProcessor
import pystem.Exceptions as E
from pystem.model.Scope import RootScope, ScopeEncoder

class Field(object):
	def __init__(self, jsonField, section):
		self.jsonField = jsonField
		self.name = jsonField['name']
		self.type = jsonField['type']
		self.section = section
		if (self.type == 'stem.TableField'):
			self.dtype = [(str(column['name']), np.float) for column in jsonField['columns']]
			
				
	def parseValue(self, jValue):
		#try:
		if (self.type == 'stem.ScalarField'):
			value = float(jValue)
		elif (self.type == 'stem.TableField'):
			value = np.recarray(shape = len(jValue), dtype = self.dtype)
			for i in range(len(jValue)):
				value[i] = tuple(jValue[i])
		elif (self.type == 'stem.TextField'):
			value = jValue
		else:
			raise E.FieldError('Unknown field type {} for field {}'.format(self.type, self.name))
		return value
		#except Exception, e:
		#	raise Exception()
	
	def serializeValue(self, value):
		if (self.type == 'stem.ScalarField'):
			jValue = value
		elif (self.type == 'stem.TableField'):
			jValue = [list(row) for row in value]
		elif (self.type == 'stem.TextField'):
			jValue = value
		else:
			raise E.FieldError("Unknown field type {}".format(self['type']), self.section['title'], self.name)
		return jValue
	
	def __str__(self):
		res = "{}:{} = {}".format(self.name, self.type)
		return res
		


class ModelCalculator(object):
	def __init__(self, modelData):
		self.modelData = modelData

	def compute(self):
		# Create the root scope
		self.rootScope = RootScope()
		# Sections with global scope
		globalSections = filter(lambda s: not s['hasScope'], self.modelData['board']['layouts'])
		# Sections with isolated scope
		isolatedSections = filter(lambda s: s['hasScope'], self.modelData['board']['layouts'])
		
		## Process global sections
		# Set all the variables in the global scope and collect all the formulas
		for section in globalSections:
			self.preProcessSection(section, self.rootScope)
		# Create the root scope processor
		formulaProcessor = FormulaBlockProcessor(self.rootScope)
		# Run the formula evaluator
		formulaProcessor.process()
		# Write back results to fields
		for section in globalSections:
			self.postProcessSection(section, self.rootScope)
		
		# Compute child scopes
		for section in isolatedSections:
			scope = self.rootScope.createChildScope()
			self.preProcessSection(section, scope)
			formulaProcessor = FormulaBlockProcessor(scope)
			formulaProcessor.process()
			self.postProcessSection(section, scope)

		print json.dumps(self.rootScope, cls = ScopeEncoder)
					
	def preProcessSection(self, section, scope):
		""" Collects all the variables and formula blocks"""			
		for field in section['fields']:
			fieldName = field['name']
			if (field['type'] == 'stem.FormulasField'):
				scope.addFormulaBlock(section['title'], field['name'], field['value'])
			elif (field['type'] == 'stem.TextField'):
				pass
			elif (field['type'] == 'stem.ScalarField' or field['type'] == 'stem.TableField'):
				if (fieldName in scope.fields):
					duplicateField = scope.fields[fieldName]
					raise E.FieldError('Duplicate field (duplicate found in section {})'.format(duplicateField.section['title']),
									section['title'], field['name'])
				pField = Field(field, section = section)
				scope.fields[fieldName] = pField					 
				scope.setSymbolValue(fieldName, pField.parseValue(field['value']))
			else:
				raise E.FieldError("Unknown field type {}".format(field['type']), section['title'], field['name'])

	def postProcessSection(self, section, scope):
		""" Set values of the calculated fields"""
		for field in section['fields']:
			if (field['type'] == 'stem.ScalarField' or field['type'] == 'stem.TableField'):
				fieldName = field['name']
				field['value'] = scope.fields[fieldName].serializeValue(
					scope.getSymbolValue(fieldName, searchImports = False)
				)
		
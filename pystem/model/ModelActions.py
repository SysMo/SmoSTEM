'''
Created on Jun 27, 2015

@author: Atanas Pavlov
'''
from __future__ import division

import numpy as np
from Formulas import FormulaBlockProcessor

class Field(object):
	def __init__(self, jsonField):
		self.jsonField = jsonField
		self.name = jsonField['name']
		self.type = jsonField['type']
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
			raise TypeError('Unknown field type {} for field {}'.format(self.type, self.name))
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
			raise TypeError('Unknown field type {} for field {}'.format(self.type, self.name))
		return jValue
	
	def __str__(self):
		res = "{}:{} = {}".format(self.name, self.type)
		return res
		


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
					

'''
Created on Jun 27, 2015

@author: Atanas Pavlov
'''
import numpy as np
from Formulas import FormulaBlockProcessor
import Exceptions as E

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
			raise E.FieldError('Unknown field type {} for field {}'.format(self.type, self.name))
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
		self.fields = {}
		self.fieldValues = {}
		self.formulaProcessor = FormulaBlockProcessor(self.fields, self.fieldValues)
		self.preCompute()
		self.formulaProcessor.process()
		self.postCompute()
		
	def preCompute(self):
		for block in self.modelData['board']['layouts']:
			for field in block['fields']:
				fieldName = field['name']
				if (field['type'] == 'stem.FormulasField'):
					self.formulaProcessor.addBlock(fieldName, field['value'])
				else:
					if (fieldName in self.fields):
						raise E.FieldError('Duplicate field "{}"'.format(fieldName))
					pField = Field(field)
					self.fields[fieldName] = pField					 
					self.fieldValues[fieldName] = pField.parseValue(field['value'])
					
	def postCompute(self):				
		for block in self.modelData['board']['layouts']:
			for field in block['fields']:
				if (field['type'] != 'stem.FormulasField'):
					fieldName = field['name']
					field['value'] = self.fields[fieldName].serializeValue(self.fieldValues[fieldName])
					

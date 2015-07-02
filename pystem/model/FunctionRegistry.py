'''
Created on Jul 1, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd., Bulgaria
'''
import numpy as np

'''
Module
{
	name: numpy
	importPath: numpy
	importName: null
	description: "Math functions"
	functions: [] 
}
'''

'''
Function
{
	name: sin
	arguments : {
		name: 'x',
		description: 'angle in radians',
		hasDefault: true,
		default: 0 
	}
	description: computes sine
	example: ""
}
'''

class FunctionRegistry(object):
	def __init__(self):
		self.funcs = {}
		self.addCoreFunctions()
		self.addMathModuleFunctions()
	
	def addCoreFunctions(self):
		coreFunctions = {
			'If': lambda cond, val1, val2: val1 if cond else val2,
			'range': lambda n: np.arange(n),
			'range1': lambda n: 1 + np.arange(n)
		}
		self.funcs.update(coreFunctions)
		
	def addMathModuleFunctions(self):
		mathFunctions = {
			'abs': np.fabs,
			# Logarithms, exponents, powers
			'exp': np.exp,			
			'log': np.log,
			'log10': np.log10,
			'log2': np.log2,
			'pow': np.power,
			'sqrt': np.sqrt,
			# Trigonometry
			'sin': np.sin,
			'cos': np.cos,
			'tan': np.tan,
			'arcsin': np.arcsin,
			'arccos': np.arccos,
			'arctan': np.arctan,
			'arctan2': np.arctan2,
			# Trigonometry hyperbolic
			'sinh': np.sinh,
			'cosh': np.cosh,
			'tanh': np.tanh,
			'arcsinh': np.arcsinh,
			'arccosh': np.arccosh,
			'arctanh': np.arctanh,
			# Sum, product
			'sum': np.sum,
			'prod': np.prod,
			'interp': np.interp,
			# Statistics
			'mean': np.mean,
			'std': np.std,
			'var': np.var,
		}
		self.funcs.update(mathFunctions)


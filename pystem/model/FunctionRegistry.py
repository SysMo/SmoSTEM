'''
Created on Jul 1, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd., Bulgaria
'''
import numpy as np

class FunctionRegistry(object):
	def __init__(self):
		self.funcs = {}
		self.addMathModuleFunctions()
	
	def addMathModuleFunctions(self):
		mathFuncs = {
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
			'interp': np.interp
		}
		self.funcs.update(mathFuncs)


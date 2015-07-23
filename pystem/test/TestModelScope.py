'''
Created on Jul 22, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''

import os, json
import unittest
from pystem.model.Scope import Scope, RootScope, ScopeEncoder,\
	UndefinedSymbolError
import numpy as np

class TestModelScope(unittest.TestCase):
	def setUp(self):
		self.rs = RootScope()
		self.rs.importModule('numpy', '', ['sin', 'cos', 'tan'])
		self.rs.importModule('numpy.linalg', 'LA', ['eig'])
		self.rs.addSymbols({'a': 3, 'b': 6})
		self.cs1 = self.rs.createChildScope({'a': 71})
		self.cs2 = self.rs.createChildScope({'a': 14})
		
	def tearDown(self):
		pass
		
	def testDefinitions(self):
		self.assertEqual(self.rs.getSymbolValue('a'), 3)
		self.assertEqual(self.rs.getSymbolValue('b'), 6)
		self.assertEqual(self.cs1.getSymbolValue('a'), 71)
		self.assertEqual(self.cs1.getSymbolValue('b'), 6)
		self.assertEqual(self.cs2.getSymbolValue('a'), 14)
		self.assertEqual(self.cs2.getSymbolValue('b'), 6)
	
	def testImports(self):
		self.assertEqual(self.cs1.getSymbolValue('sin'), np.sin)
		self.assertEqual(self.cs1.getSymbolValue('cos'), np.cos)
		self.assertEqual(self.cs1.getSymbolValue('LA')['eig'], np.linalg.eig)
		with self.assertRaises(UndefinedSymbolError):
			self.cs1.getSymbolValue('tanh')
	
	def testSetSymbols(self):
		self.rs.setSymbolValue('x', 7)
		self.cs1.setSymbolValue('y', 10)
		self.assertEqual(self.cs1.getSymbolValue('x'), 7)
		self.assertEqual(self.cs1.getSymbolValue('y'), 10)
		
					
	def testPrint(self):	
		print json.dumps(self.rs, cls = ScopeEncoder, indent = 4)
		
if __name__ == '__main__':
	unittest.main()
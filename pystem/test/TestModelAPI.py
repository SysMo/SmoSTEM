'''
Created on Jun 19, 2015

@author: Atanas Pavlov
'''

import os
import BaseServer as BS
import unittest
import tempfile
import json

class TestModelAPI(unittest.TestCase):
	def setUp(self):
		testDB = 'stem_test'
		BS.mongoClient.drop_database(testDB)

		BS.app.config['STEM_DATABASE'] = 'stem_test'
		BS.app.config['TESTING'] = True
		self.app = BS.app.test_client(testDB)
		
	def tearDown(self):
		pass
	
	def testGetModelList(self):
		result = json.loads(self.app.get('/stem/api/Models').data)
		assert result == []

	def testCreateModel(self):
		result = json.loads(self.app.post('/stem/api/Models', data = dict()).data)
		print result
	
if __name__ == '__main__':
	unittest.main()
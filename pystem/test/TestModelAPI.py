'''
Created on Jun 19, 2015

@author: Atanas Pavlov
'''

import os
import StemServer as BS
import unittest
import tempfile
import json

class TestModelAPI(unittest.TestCase):
	def setUp(self):
		self.testDB = 'stem_test'
		BS.mongoClient.drop_database(self.testDB)

		BS.app.config['STEM_DATABASE'] = 'stem_test'
		BS.app.config['TESTING'] = True
		self.app = BS.app.test_client(self.testDB)
		
	def tearDown(self):
		BS.mongoClient.drop_database(self.testDB)
	
	def testGetModelList(self):
		result = json.loads(self.app.get('/stem/api/Models').data)
		assert result == []

	def testCreateDeleteModel(self):
		response = self.app.post('/stem/api/Models', 
				data = json.dumps({'name':'Hipopo'}), content_type = 'application/json')
		self.assertEqual(response.status_code, 200)
		modelID = json.loads(response.data)['_id']
		result = json.loads(self.app.get('/stem/api/Models').data)
		self.assertEqual(len(result), 1)
		response = self.app.delete('/stem/api/Models/{}'.format(modelID))
		self.assertEqual(response.status_code, 200)
		result = json.loads(self.app.get('/stem/api/Models').data)
		self.assertEqual(len(result), 0)
	
if __name__ == '__main__':
	unittest.main()
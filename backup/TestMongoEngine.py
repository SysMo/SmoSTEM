'''
Created on Jul 13, 2015

@author: Atanas Pavlov
'''
from flask import Flask
from flask_mongoengine import MongoEngine
import mongoengine.fields as F
import datetime 

# Create app
app = Flask(__name__)
app.config['DEBUG'] = True
app.config['MONGODB_DB'] = 'stem'
app.config['MONGODB_HOST'] = 'localhost'
app.config['MONGODB_PORT'] = 27017
# Create database connection object
db = MongoEngine(app)

class Model(db.Document):
	meta = {
		'collection': 'Models',
		'indexes': ['name'] 
	}
	name = F.StringField(max_length = 200, required=True, default = 'Untitled')
	description = F.StringField()
	created = F.DateTimeField(default = datetime.datetime.utcnow)
	board = F.ListField()
	background = F.StringField(max_length = 200)

class Quantity(db.Document):
	meta = {'collection': 'Quantities'}
	name = F.StringField(required=True, default = '<noname>')
	label = F.StringField()
	SIUnit = F.StringField(required=True, default = '<noname>')
	units = F.ListField()

class FunctionArgument(db.EmbeddedDocument):
	name = F.StringField(required=True, default = '')
	description = F.StringField()	
	
class LibraryFunction(db.EmbeddedDocument):
	name = F.StringField(required=True, default = '')
	description = F.StringField()
	arguments = F.ListField(F.EmbeddedDocumentField(FunctionArgument))

class LibraryModule(db.Document):
	meta = {'collection': 'LibraryModules'}
	name = F.StringField(required=True, default = '<noname>')
	description = F.StringField()
	importPath = F.StringField()
	importName = F.StringField()
	functions = F.ListField(F.EmbeddedDocumentField(LibraryFunction))
	
@app.route('/Models')
def models():
	result =  Model.objects()
	return result.to_json()
	
@app.route('/Quantities')
def quantities():
	result =  Quantity.objects()
	print result
	return result.to_json()

@app.route('/LibraryModules')
def modules():
	result =  LibraryModule.objects()
	print str(result[0])
	return result.to_json()

if __name__ == '__main__':
	app.run()
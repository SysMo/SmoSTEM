'''
Created on Jul 13, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''
import os, sys
from fabric.api import run, sudo, env, cd, prefix, hosts, local, lcd, put

srvAddress = 'stem.sysmoltd.com' 
if (len(env.hosts) == 0):
	env.hosts = [srvAddress]
env.projectRoot = os.getcwd()
env.installDir = '/srv/Stem/'
env.deploy_folderList = [
	'static', 'pystem', 'templates'
]
env.deploy_pythonFiles = [
	'wsgi.py',
	'config.py',
]

def deploy():
	"""
	Deploy the local site version on the server 
	"""
	print("Cleaning up old code and static files")
	local('rm -rf {0}/*'.format(env.installDir))
	print("Copying files")
	for folder in env.deploy_folderList:
		local('cp -r ./{} {env.installDir}'.format(folder, env = env), shell='bash')
	for pyFile in env.deploy_pythonFiles:
		local('cp ./{} {env.installDir}'.format(pyFile, env = env), shell='bash')
	
	for host in env.hosts:
		local('unison -ignore "Name {*.pyc, *.sql*}" -ignore "Path Log/*" -ignore "Path Media/*" ' + 
			' {env.installDir} ssh://{host}//{env.installDir}'.format(host = host, env = env))
		sudo('chown -R www-data:www-data {env.installDir}'.format(env = env))
		sudo('service apache2 restart')
	#sudo('/etc/init.d/celeryd restart')

def mongo_update(collection):
	put('backup/mongo/{collection}.json'.format(collection = collection), '/tmp/')
	run('mongoimport --db stem --collection {collection} < /tmp/{collection}.json'.format(collection = collection))
	
def mongo_ensureIndexes():
	"""
	Create indexes for all the registered_documents
	"""
	sys.path.append(os.path.dirname(__file__))
	from DevelopmentServer.py.DevelopmentServer import mongoConnection, app
	conn = mongoConnection
	db = mongoConnection[app.config['STEM_DATABASE']]
	for doc, obj in conn._registered_documents.iteritems():
		collection = db[obj.__collection__]
		print('--------------------------------------------')
		print("Generating indices for collection {}".format(obj.__collection__))
		if (hasattr(obj, 'indexes')):
			for index in obj.indexes:
				print("\tGenerating index on fields {}".format(index['fields']))
				unique = index.get('unique', False)
				collection.ensure_index(index['fields'], unique = unique)
		else:
			print("No indexes defined for collection {}".format(obj.__collection__))
		
def mongo_listIndexes():
	"""
	List indexes for all the registered_documents
	"""
	sys.path.append(os.path.dirname(__file__))
	from DevelopmentServer.py.DevelopmentServer import mongoConnection, app
	conn = mongoConnection
	db = mongoConnection[app.config['STEM_DATABASE']]
	for doc, obj in conn._registered_documents.iteritems():
		collection = db[obj.__collection__]
		print('--------------------------------------------')
		print("Indices for collection {}".format(collection))
		print collection.index_information()
		
def backupMongoStem():
	"""
	Export the database content to JSON files
	"""
	collections = ['Quantities', 'LibraryModules']
	for collection in collections:
		run('mongoexport --db stem --collection {collection} > backup/mongo/{collection}.json'.format(collection = collection))
	
def testTask():
	print "Hosts: {}".format(env.hosts)
'''
Created on Jul 13, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''
import os
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
	'StemServer.py',
	'wsgi.py',
	'Settings.py'
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

	local('unison -ignore "Name {*.pyc, *.sql*}" -ignore "Path Log/*" -ignore "Path Media/*" ' + ' {env.installDir} ssh://{env.hosts}//{env.installDir}'.format(env = env))
	sudo('chown -R www-data:www-data {env.installDir}'.format(env = env))
	sudo('service apache2 restart')
	#sudo('/etc/init.d/celeryd restart')

def update_mongo(collection):
	put('backup/mongo/{collection}.json'.format(collection = collection), '/tmp/')
	run('mongoimport --db stem --collection {collection} < /tmp/{collection}.json'.format(collection = collection))
	
def backupMongoStem():
	"""
	Export the database content to JSON files
	"""
	collections = ['Quantities', 'LibraryModules']
	for collection in collections:
		run('mongoexport --db stem --collection {collection} > backup/mongo/{collection}.json'.format(collection = collection))
	
def testTask():
	print "Hosts: {}".format(env.hosts)
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
		
def backupMongoStem():
	"""
	Export the database content to JSON files
	"""
	import datetime
	sys.path.append(os.path.dirname(__file__))
	from config import MONGODB_SETTINGS
	with cd('/data/StemBackup/Mongo/'):
		folderName = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
		run('mkdir {}'.format(folderName))
		collections = ['Users', 'Roles', 'Quantities', 'LibraryModules', 'Models', 'ModelUserAccess']
		for collection in collections:
			run('mongoexport --db stem --collection {collection} -ssl -u {MS[username]} -p {MS[password]} > {folderName}/{collection}.json'.format(
					collection = collection, folderName = folderName, MS = MONGODB_SETTINGS))
		run('tar -zcvf {name}.tar.gz {name}'.format(name = folderName))
		run('rm -rf {name}'.format(name = folderName))
	
def testTask():
	print "Hosts: {}".format(env.hosts)
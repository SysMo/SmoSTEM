flaskPackages = [
	'Flask',
 	'Flask-Admin',
 	'Flask-Bcrypt',
 	'Flask-Login',
 	'Flask-Mail',
 	'Flask-Principal',
 	'Flask-RESTful',
 	'Flask-Security',
 	'Flask-Sendmail',
 	'Flask-WTF',
 	'Flask-Mongoengine'
]

mathPackages = [
	'numpy', 'scipy', 'matplotlib', 'pandas', 'cython', #'h5py'
]

engineeringPackages = [
	#'coolprop'
]

requiredPackages = flaskPackages + mathPackages + engineeringPackages
requiredPackages = map(lambda s: s.lower(), requiredPackages)


import subprocess as SP

#SP.Popen(["/bin/bash", "echo $SHELL"])
def runVECmd(cmd, stdout = SP.PIPE):
	proc = SP.Popen("unset PYTHONHOME && unset PYTHONPATH && {source} && {command}".format(source = sourceCmd, command = cmd), 
				stdin = SP.PIPE, stdout = stdout, 
				shell = True, executable = "/bin/bash")
	
	stdout_data, stderr_data = proc.communicate()
	return stdout_data

def getInstalledPackages():
	result = runVECmd(cmd = 'pip freeze')
	pckgList = result.split('\n')
	packages = []
	for pkg in pckgList:
		packages.append(pkg.split("=")[0].lower())
	return packages

def installPackage(pkgName):
	runVECmd(cmd = 'pip install {}'.format(pkgName), stdout = None)

sourceCmd = 'source /srv/VirtualEnv/SmoWebPlatform/bin/activate'
result = runVECmd(cmd = 'which python')
print("Using {}".format(result))
installedPackages = getInstalledPackages()

for package in requiredPackages:
	if (package in installedPackages):
		print('Package {} already installed'.format(package))
	else:
		print('Installing package {}'.format(package))
		installPackage(package)
		print('Finished installing package {}'.format(package))
		
	
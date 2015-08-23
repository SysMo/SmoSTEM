'''
Created on Jun 19, 2015

@author: Atanas Pavlov
'''

# CAUTION
# Eidt this file using your database and other settings
# Once you are done, make sure you keep the file private,
# so that no one else get access to your passwords.

# Session etc.
SECRET_KEY = 'secret-key'

# Database configuration
MONGODB_SETTINGS = {
	'host': 'my.dbhost.com',
	'port': 27017,
	'db': 'db',
	'username': 'dbUser',
	'password':'dbPassword',
	'ssl': True
}

# Mail configuration
MAIL_SERVER = "my.mail.server.com"
MAIL_PORT = 587
MAIL_USE_TLS = True
MAIL_USE_SSL = False
MAIL_USERNAME = "mailUser"
MAIL_PASSWORD = "mailPassword"
MAIL_DEFAULT_SENDER = "webmaster@mysite.com"

# Default limits
LIMITS_MAX_N_LOOPS = 1000
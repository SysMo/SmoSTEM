'''
Created on Jul 20, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''
import numpy as np

def lambda2phi(lam):
	l2phi=[
	    [6,8,10,12,14,16,18,20],
	    [.92,.91,.9,.88,.84,.79,.74,.67]
	]
	return np.interp(lam, l2phi[0], l2phi[1])

# def OrazmeriFundament(b, h):
# 	Bfun = b + 10
# 	Hfun = Bfun + h - b
# 	T2.Gfun=T2.Bfun*T2.Hfun*T2.hfun*25000
# 	T2.Nsum=T2.Nser+T2.Gfun
# 	b1=1
# 	t1=2
'''
Created on Aug 4, 2015

@author: Atanas Pavlov
@copyright: SysMo Ltd, Bulgaria
@licence: See License.txt in the main folder
'''
import numpy as np

MAX_ITER = 100

def involute(alpha):
	return np.tan(alpha)-alpha

def _involuteInverse(value, maxError, maxIter):
	if (value < 0):
		raise ValueError("Argument to involute inverse must be >= 0")
	if (value < 1e-6):
		return (3*value)**(1./3);
	alpha = 0.2
	i = 0
	maxIter = min(maxIter, MAX_ITER)
	errorFunc = lambda alpha: (np.tan(alpha) - alpha - value)
	error = errorFunc(alpha)
	while (abs(error) > 1e-5):
		corr = error / (np.tan(alpha)**2)
		alphaNew = alpha - corr
		if (alphaNew >= np.pi/2):
			alpha = alpha + 0.5 * (np.pi/2 - alpha)
		elif (alphaNew < 0):
			alpha = 0.5 * alpha
		else:
			alpha = alphaNew
		error = errorFunc(alpha)
		i += 1
		if (i > maxIter):
			raise ValueError("involuteInverse did not converge: error = {}".format(error))
	return alpha

involuteInverseVec = np.frompyfunc(_involuteInverse, 3, 1)

def involuteInverse (value, maxError = 1e-5, maxIter = 100):
	result = involuteInverseVec(value, maxError, maxIter)
	print
	print result
	return result
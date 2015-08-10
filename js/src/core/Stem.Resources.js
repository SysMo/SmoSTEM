(function(window, angular) {
var interceptors = {
	//Provides the API for querying and manipulating models on the server
	'response': null,
	'responseError': function (response) {
		var errorData = response.data;
		var errorView;
		var msg;
		if ('msg' in errorData) {
			msg = errorData.msg.replace(/(?:\r\n|\r|\n)/g, '<br />');			
		} else {
			msg = angular.toJson(errorData);
		}
		if (errorData.type == 'APIException') {
			errorView = 
			'<p>' + errorData.excType + '</p>' +
			'<p>' + msg + '</p>';					
		} else if (errorData.type == 'Exception') {
			errorView = 
			'<p>' + errorData.excType + '</p>' +
			'<p>' + msg + '</p>';
		} else {
			errorView = msg;
		}
		if (angular.isString(errorData.traceback) && errorData.traceback.length > 0) {
			errorView += '<pre>' + errorData.traceback + '</pre>';
		}		
		$('#ErrorModal .modal-body').html(errorView);
		$('#ErrorModal').modal("show");
	}
};



Stem.config(['$resourceProvider', function($resourceProvider) {
	$resourceProvider.defaults.actions.get.interceptor = interceptors;
	$resourceProvider.defaults.actions.query.interceptor = interceptors;
	$resourceProvider.defaults.actions.save.interceptor = interceptors;
	$resourceProvider.defaults.actions.update = {
		method: 'PUT',
		interceptor : interceptors
	};
	$resourceProvider.defaults.actions.delete.interceptor = interceptors;
}]);
Stem.factory('StemResources', ['$resource', 'ngToast', '$timeout', 
                               function($resource, ngToast, $timeout) {
	function ResponseHandler(response) {
		var msg = response.headers('X-status-msg') || 'Success';
		$timeout(function() {
			ngToast.success({
		        content:msg,
		        dismissOnTimeout: true,
		        timeout: 1500
		     });  
	    });
		return response.resource;
	}
	interceptors.response = ResponseHandler;
	function serializeMathJSON(data) {
		var result = JSON.stringify(data, function(key, value) {
			// Uses code from angular.toJsonReplacer
			var val = value;
			if (typeof key === 'string' && key.charAt(0) === '$' && key.charAt(1) === '$') {
				val = undefined;
			} else if (value && value.window === value) {
				val = '$WINDOW';
			} else if (value && document === value) {
				val = '$DOCUMENT';
			} else if (value && value.$evalAsync && value.$watch) {
				val = '$SCOPE';
			} else if (value === Infinity) {
				val = '$float___inf';
			} else if (value === -Infinity) {
				val = '$float___-inf';
			} else if (String(value) == "NaN") {
				val = '$float___nan';
			}
			return val;
		});
		return result;
	}
	function parseMathJSON(data) {
		result = angular.fromJson(data);
		function jsonParserReplacer(obj) {
			angular.forEach(obj, function(value, key, obj) {
				if (angular.isString(value)) {
					if (value.indexOf('$float___') === 0) {
						var valueStr = value.substr('$float___'.length);
						if (valueStr == 'inf') {
							obj[key] = Infinity;
						} else if (valueStr == '-inf') {
							obj[key] = -Infinity;
						} else {
							obj[key] = NaN;
						}
					}
				} else if (angular.isArray(value) || angular.isObject(value)) {
					jsonParserReplacer(value);
				} 
			});
		}
		jsonParserReplacer(result);
		return result;
	}
	var StemResources = {
		StandardResource: function(resourceName, editorPath) {
			this.editorPath = editorPath;
			this.query = function(params) {
				this.collection = StemResources[resourceName].query(params);
				return this.collection;
			};
			// Open entity editor
			this.edit = function(entity) {
				window.location.href = editorPath + "/" + entity._id;
			};
			// Delete entity on the server and reload collection
			this.del = function(entity) {
				entity.$delete();
				this.collection = StemResources[resourceName].query();
			};
			// Create a new entity and open entity editor
			this.create = function() {
				var entity = new StemResources[resourceName]();
				entity.$save(function() {
					window.location.href = editorPath + "/" + entity._id;
				});
			};
			
			this.duplicate = function(entity) {
				entity.$clone(function() {
					window.location.href = editorPath + "/" + entity._id;
				});
			};
		},
		Models:
			$resource('/stem/api/Models/:_id/:action', { _id: '@_id' }, 
			{	
				query: {
					method: 'GET',
					isArray: true,
					interceptor: interceptors,
				},
				get: {
					method: 'GET',
					transformResponse: parseMathJSON,
					interceptor: interceptors,
				},
				create : {
					method: 'POST',
					interceptor: interceptors,
				},
				update: { 
					method: 'PUT',
					interceptor: interceptors,
					transformRequest: serializeMathJSON,
				},
				clone: {
					method: 'POST',
					interceptor: interceptors,
					transformRequest: serializeMathJSON,
					transformResponse: parseMathJSON,
				},
				delete: {
					method: 'DELETE',
					interceptor: interceptors,
				},
				compute: { 
					method: 'POST', 
					params: {
						action: "compute" 
					},
					interceptor: interceptors,
					transformRequest: serializeMathJSON,
					transformResponse: parseMathJSON,
				},
			}),
		Quantities:
			$resource('/stem/api/Quantities/:_id', { _id: '@_id' },
			{
				load: {
					method: 'GET',
					params: {
						full: true
					},
					isArray: true,
					interceptor : interceptors
				},
			}),
		LibraryModules:
			$resource('/stem/api/LibraryModules/:_id', { _id: '@_id' }, {
				load: {
					method: 'GET',
					params: {
						full: true
					},
					isArray: true,
					interceptor : interceptors
				},
			}),
		Users:
			$resource('/stem/api/Users/:action', {}, {
				login: {
					method: 'POST',
					params: {
						action: 'login'
					},
				},
				logout: {
					method: 'POST',
					params: {
						action: 'logout'
					}
				},
				create: {
					method: 'POST',
					params: {
						action: 'create'
					},
				},
			})
	};
	return StemResources;
}]);

})(window, window.angular);
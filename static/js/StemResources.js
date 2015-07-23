//Provides the API for querying and manipulating models on the server
Stem.factory('StemResources', function($resource, ngToast, $timeout) {
	function ErrorHandler(response) {
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
			'<p>' + msg + '</p>' +
			'<pre>' + errorData.traceback + '</pre>';		
		} else {
			errorView = msg;
		}
		$('#ErrorModal .modal-body').html(errorView);
		$('#ErrorModal').modal("show");
	}
	function OnSuccess(response) {
		var msg = response.headers('X-status-msg') || 'Success';
		$timeout(function() {
			ngToast.success({
		        content:msg,
		        dismissOnTimeout: true,
		        timeout: 1500
		     });  
	    });
	};
	var StemResources = {
		StandardResource: function(resourceName, editorPath) {
			this.editorPath = editorPath
			this.query = function() {
				this.collection = StemResources[resourceName].query();
				return this.collection;
			} 
			// Open entity editor
			this.edit = function(entity) {
				window.location.href = editorPath + "/" + entity._id;
			}
			// Delete entity on the server and reload collection
			this.del = function(entity) {
				entity.$delete();
				this.collection = StemResources[resourceName].query();
			}
			// Create a new entity and open entity editor
			this.create = function() {
				var entity = new StemResources[resourceName]();
				entity.$save(function() {
					window.location.href = editorPath + "/" + entity._id;
				});
			}
			
			this.duplicate = function(entity) {
				entity.$clone(function() {
					window.location.href = editorPath + "/" + entity._id;
				});
			}
		},
		Models:
			$resource('/stem/api/Models/:_id', { _id: '@_id' }, 
			{	
				query : {
					isArray: true,
					interceptor : {responseError : ErrorHandler}
				},
				get: {
					method: 'GET',
					interceptor : {responseError : ErrorHandler}
				},
				save: {
					method: 'POST',
					interceptor : {responseError : ErrorHandler}
				},
				clone: {
					method: 'POST',
					params: {
						action: "clone" 
					},
					interceptor : {responseError : ErrorHandler}
				},
				update: { 
					method:'PUT',
					interceptor : {	
						response: OnSuccess,
						responseError : ErrorHandler
					}
				},
				compute: { 
					method: 'POST', 
					params: {
						action: "compute" 
					},
					interceptor : {	
						response: OnSuccess,
						responseError : ErrorHandler
					}
				},
			}),
		Quantities:
			$resource('/stem/api/Quantities/:_id', { _id: '@_id' },
			{
				query : {
					isArray: true,
					interceptor : {responseError : ErrorHandler}
				},
				get: {
					interceptor : {responseError : ErrorHandler}
				},
				load: {
					method: 'GET',
					params: {
						full: true
					},
					isArray: true,
					interceptor : {responseError : ErrorHandler}
				},
				save: {
					method: 'POST',
					interceptor : {
						response: OnSuccess,
						responseError : ErrorHandler
					}
				},
				update: { 
					method:'PUT', 
					interceptor : {
						response: OnSuccess,
						responseError : ErrorHandler
					}
				}, 
			}),
		LibraryModules:
			$resource('/stem/api/LibraryModules/:_id', { _id: '@_id' }, {
				query : {
					isArray: true,
					interceptor : {responseError : ErrorHandler}
				},
				get: {
					interceptor : {responseError : ErrorHandler}
				},
				load: {
					method: 'GET',
					params: {
						full: true
					},
					isArray: true,
					interceptor : {responseError : ErrorHandler}
				},
				save: {
					method: 'POST',
					interceptor : {responseError : ErrorHandler}
				},
				update: { 
					method: 'PUT', 
					interceptor : {responseError : ErrorHandler}
				},
			}),
		Users:
			$resource('/stem/api/Users', {}, {
				login: {
					method: 'POST',
					params: {
						action: 'login'
					},
					interceptor : {responseError : ErrorHandler}
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
					interceptor : {responseError : ErrorHandler}
				},
			})
	};
	return StemResources;
});

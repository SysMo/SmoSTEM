//Provides the API for querying and manipulating models on the server
Stem.factory('StemResources', function($resource, ngToast, $timeout) {
	function ErrorHandler(response) {
		var errorData = response.data;
		var errorView;
		if (errorData.type == 'APIException') {
			errorView = 
			'<p>' + errorData.excType + '</p>' +
			'<p>' + errorData.msg + '</p>';					
		} else if (errorData.type == 'Exception') {
			errorView = 
			'<p>' + errorData.excType + '</p>' +
			'<p>' + errorData.msg + '</p>' +
			'<pre>' + errorData.traceback + '</pre>';		
		} else {
			if ('msg' in errorData) {
				errorView = errorData.msg;
			} else {
				errorView = angular.toJson(errorData);
			}
		}
		$('#ErrorModal .modal-body').html(errorView);
		$('#ErrorModal').modal("show");
	}
	function OnSuccess(response) {
		$timeout(function() {
			ngToast.success({
		        content:'Success',
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
				entity.$save(function() {
					window.location.href = editorPath + "/" + entity._id;
				});
			}
		},
		Models:
			$resource('/stem/api/Models/:_id', { _id: '@_id' }, 
			{	
				get: {
					method: 'GET',
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
				update: { 
					method:'PUT', 
					interceptor : {responseError : ErrorHandler}
				}, 
			}),
		LibraryModules:
			$resource('/stem/api/LibraryModules/:_id', { _id: '@_id' }, {
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
					}
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
					}
				},
			})
	};
	return StemResources;
});

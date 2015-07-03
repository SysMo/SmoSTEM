//Provides the API for querying and manipulating models on the server
Stem.factory('StemResources', function($resource) {
	function ErrorHandler(response) {
		console.log(response);
		$('#errorModal .modal-body').html(
			'<p>' + response.data.msg + '</p>' +
			'<p>' + response.data.exception + '</p>' +
			'<pre>' + response.data.traceback + '</pre>'		
		);
		$('#errorModal').modal("show");
	}
	var StemResources = {
		StandardResource: function(resourceName, editorPath) {
			this.editorPath = editorPath
			this.query = function() {
				this.collection = StemResources[resourceName].query();
				return this.collection;
			} 
			// Open entity editor
			this.edit = function(entity) {
				window.location.href = editorPath + "/" + entity._id.$oid;
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
					window.location.href = editorPath + "/" + entity._id.$oid;
				});
				
			}
		},
		Models:
			$resource('/stem/api/Models/:_id', { _id: '@_id' }, 
			{	
				get: {
					method: 'GET'
				},
				post: {
					method: 'POST',
					interceptor : {responseError : ErrorHandler}
				},
				update: { 
					method:'PUT' 
				}, 
				compute: { 
					method: 'POST', 
					params: {
						action: "compute" 
					},
					interceptor : {responseError : ErrorHandler}
				}
			}),
		Quantities:
			$resource('/stem/api/Quantities/:id', { id: '@_id.$oid' },
			{
				get: {
					interceptor : {responseError : ErrorHandler}
				},
				load: {
					method: 'GET',
					params: {
						full: true
					}
				},
				post: {
					method: 'POST',
					interceptor : {responseError : ErrorHandler}
				},
				update: { 
					method:'PUT', 
					interceptor : {responseError : ErrorHandler}
				}, 
			})
	};
	return StemResources;
});
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
	return { 
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
			$resource('/stem/api/Quantities/:_id', { _id: '@_id' },
			{
				load: {
					method: 'GET',
					params: {
						full: true
					}
				}
			})
	}
});
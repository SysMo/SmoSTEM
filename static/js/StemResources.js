//Provides the API for querying and manipulating models on the server
Stem.factory('StemResources', function($resource) {  
	return { 
		Models:
			$resource('/stem/api/Models/:_id', { _id: '@_id' }, 
			{				
				update: { 
					method:'PUT' 
				}, 
				compute: { 
					method: 'POST', 
					params: {
						action: "compute" 
					}
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
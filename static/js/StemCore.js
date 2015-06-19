var Stem = angular.module('Stem',['ngResource']);

// Page with model list
Stem.controller('ModelCollectionCtrl', function($scope, PageSettings, ModelService, ServerErrorHandler){
	$scope.models = ModelService.modelDefinitionResource.query(function(data) {
	}, ServerErrorHandler);
	// Open model editor
	$scope.editModel = function(model) {
		window.location.href = '/ModelEditor/' + model._id;
	}
	// Delete model on the server and reload models
	$scope.deleteModel = function(model) {
		model.$delete();
		$scope.models = ModelService.modelDefinitionResource.query(function(data) {
		}, ServerErrorHandler);	}
	// Create a new model and open model editor
	$scope.createModel = function(model) {
		var model = new ModelService.modelDefinitionResource();
		model.$save(function() {
			window.location.href = '/ModelEditor/' + model._id;	
		});
		
	}
});

// Page with model editor
Stem.controller('ModelEditorCtrl', function($scope, 
		PageSettings, ModelService){
	$scope.model =  ModelService.modelDefinitionResource.get({_id: PageSettings.modelID});
	$scope.save = function() {
		ModelService.modelDefinitionResource.update({_id: PageSettings.modelID}, {name: $scope.model.name, description: $scope.model.description});
	};
	$scope.compute = function() {
		ModelService.computeResource.compute({_id: PageSettings.modelID}, {params: 3}, function(responseData) {
			console.log(responseData.message);
		});
	};
});

// To be used for logging erros on ngResource calls
Stem.factory('ServerErrorHandler', function() {
	// Currently a dummy implementation
	return function(data) {
		console.log(data);
	}
});


//Provides the API for querying and manipulating models on the server
Stem.factory('ModelService', function($resource) {  
	return {
		modelDefinitionResource: $resource('/stem/api/Models/:_id', 
							{ _id: '@_id' }, 
							{				
								update: { method:'PUT' }
							}
						),
		computeResource: $resource('/stem/api/ModelDefinitions/compute/:_id', 
							{ _id: '@_id' }, 
							{
								compute: { method:'POST' }
							}
						)
	};
});

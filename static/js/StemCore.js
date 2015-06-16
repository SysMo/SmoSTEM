var Stem = angular.module('Stem',['ngResource']);
Stem.controller('StemCtrl', function($scope, ModelCollection){
	$scope.modelCollection = new ModelCollection();
	$scope.modelCollection.loadModels();
});

/** Model collection provides storage of models and 
	methods to create/update/delete models in the collection
*/
Stem.factory('ModelCollection', function(ModelDefinitionAPI, $location){
	var ModelCollection = Class.extend({
		init: function() {
			this.models = [];		
		},
		// loads models from the server
		loadModels: function() {
			this.models = ModelDefinitionAPI.query(function() {
				console.log("Models loaded");
			});
		},
		// create a new model and opens model editor
		createEditNewModel: function() {
			var newModel = new ModelDefinitionAPI();
			newModel.name = 'WebName';
			newModel.description = 'WebDescription';
			collection = this;
			ModelDefinitionAPI.save(newModel, function() {
				console.log("New model created");
				collection.loadModels();
			});
		},
		// open model editor
		editModel: function(model) {
			window.location.href = '/ModelEditor/' + model._id;
		},
		// delete a model
		deleteModel: function(model) {
			collection = this;
			ModelDefinitionAPI.delete(model, function() {
				console.log("Model deleted");
				collection.loadModels();
			});
		}
	});
	
	return ModelCollection;
});

// Provides the API for manipulating and querying models on the server
Stem.factory('ModelDefinitionAPI', function($resource) {
	return $resource('/stem/api/ModelDefinitions/:_id');
});
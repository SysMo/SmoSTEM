var Stem = angular.module('Stem',['ngResource']);

Stem.controller('ModelCollectionCtrl', function($scope, PageSettings, ModelCollection){
	$scope.modelCollection = new ModelCollection();
	$scope.modelCollection.loadModels();
});

Stem.controller('ModelEditorCtrl', function($scope, 
		PageSettings, Model){
	$scope.activeModel =  new Model();
	$scope.activeModel.loadModel(PageSettings.modelID);
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
			newModel.$save(function() {
				window.location.href = '/ModelEditor/' + newModel._id;	
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

Stem.factory('Model', function(ModelDefinitionAPI) {
	var Model = Class.extend({
		init: function() {
			
		},
		loadModel: function(modelID) {
			model = this;			
			modelData = ModelDefinitionAPI.get({_id: modelID}, function() {
				model.name = modelData.name;
				model.description = modelData.description;
				model.variableValues = modelData.variableValues;
				model.interfaceGroups = modelData.interfaceGroups;
			});
		}
	});
	return Model;
});

// Provides the API for manipulating and querying models on the server
Stem.factory('ModelDefinitionAPI', function($resource) {
	return $resource('/stem/api/ModelDefinitions/:_id', 
		{ _id: '@_id' }, {				
			update: 'PUT'
		}
	);
});
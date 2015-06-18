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
		var model = new ModelService();
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
	$("#main").height(500);
	
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
		modelDefinitionResource: $resource('/stem/api/ModelDefinitions/:_id', 
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

//Utility functions
Stem.factory('stemUtil', function stemUtil () {
	return {
		guid: function () {
		    function _p8(s) {
		        var p = (Math.random().toString(16)+"000000000").substr(2,8);
		        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
		    }
		    return _p8() + _p8(true) + _p8(true) + _p8();
		},
	};
})

// User defined 'Classes'
Stem.factory('stemClasses', function stemClasses(stemUtil) {
	var classes = {};
	function createInstanceCounter(klass) {
		klass.instanceCounter = 0;
	}
	
	classes.Variable = Class.extend({
		type: 'stem.Variable',
		init: function () {
			// Create unique id
			this.id = stemUtil.guid();			
		},
		edit: function() {
			$( '#' + this.id +'-modal').modal( "show" );
		},
		del: function() {
			this.parent.deleteVariable(this);
		},
	});
	
	classes.ScalarVariable = classes.Variable.extend({
		type: 'stem.ScalarVariable',
		init: function(name, description) {
			this._super();
			this.description = description || '';
			this.name = name || ('v' + (classes.ScalarVariable.instanceCounter + 1).toString());
			classes.ScalarVariable.instanceCounter++;
			this.value = 0;
		},
	});
	createInstanceCounter(classes.ScalarVariable);
	
	classes.TableVariable = classes.Variable.extend({
		type: 'stem.TableVariable',
		init: function(name, description, columns, data) {
			this._super();
			this.description = description || '';
			this.name = name || ('T' + (classes.TableVariable.instanceCounter + 1).toString());
			classes.TableVariable.instanceCounter++;
			this.columns = columns || [{name : 'c1'}];
			this.data = data || [[0]];
		}
	})
	
	createInstanceCounter(classes.TableVariable);
	
	classes.VariableContainer = Class.extend({
		init: function() {
			this.variables = [];
		},
		createScalarVariable: function(name, description) {
			var variable = new classes.ScalarVariable(name, description);
			variable.parent = this;
			this.variables.push(variable);
			return variable;
		},
		createTableVariable: function(name, description, columns, value) {
			var variable = new classes.TableVariable(name, description, columns, value);
			variable.parent = this;
			this.variables.push(variable);
			return variable;
		},
		addVariable: function(variable) {
			variable.parent = this;
			this.variables.push(variable);
		},
		deleteVariable: function(variable) {
			var index = this.variables.indexOf(variable);
			if (index >= 0) {
				this.variables.splice(index, 1);
			}
		},
		getValues: function() {
			var values = {};
			for (var i = 0; i < this.variables.length; i++) {
				var variable = this.variables[i];
				values[variable.name] = parseFloat(variable.value);
			}
			return values;
		},
		setValues: function(values) {
			for (var i = 0; i < this.variables.length; i++) {
				var variable = this.variables[i];
				variable.value = values[variable.name];
			}
		},
	});
	
	return classes;
});
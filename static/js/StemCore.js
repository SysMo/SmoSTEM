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
	
	classes.Field = Class.extend({
		type: 'stem.Field',
		init: function () {
			// Create unique id
			this.id = stemUtil.guid();			
		},
		edit: function() {
			$( '#' + this.id +'-modal').modal( "show" );
		},
		del: function() {
			this.parent.removeField(this);
		},
	});
	
	classes.ScalarField = classes.Field.extend({
		type: 'stem.ScalarField',
		init: function(name, label, value) {
			this._super();
			this.label = label || '';
			this.name = name || ('v' + (classes.ScalarField.instanceCounter + 1).toString());
			classes.ScalarField.instanceCounter++;
			this.value = value || 0;
		},
	});
	createInstanceCounter(classes.ScalarField);
	
	classes.TableField = classes.Field.extend({
		type: 'stem.TableField',
		init: function(name, label, columns, value) {
			this._super();
			this.label = label || '';
			this.name = name || ('T' + (classes.TableField.instanceCounter + 1).toString());
			classes.TableField.instanceCounter++;
			this.columns = columns || [{name : 'c1'}];
			this.value = value || [[0]];
		}
	});	
	createInstanceCounter(classes.TableField);
	
	classes.TextField = classes.Field.extend({
		type: 'stem.TextField',
		init: function(name, label, value) {
			this._super();
			this.label = label || '';
			this.name = name || ('T' + (classes.TextField.instanceCounter + 1).toString());
			classes.TextField.instanceCounter++;
			this.value = value || '';
		}
	});	
	createInstanceCounter(classes.TextField);
	
	classes.Layout = Class.extend({
		init: function(type, width, fields) {
			this.type = type || 'grid';
			this.width = width || 'wide';
			this.fields = fields || [];
		},
		addField: function(field) {
			field.parent = this;
			this.fields.push(field);
		},
		removeField: function(field) {
			var index = this.fields.indexOf(field);
			if (index >= 0) {
				this.fields.splice(index, 1);
			}
		},
		createScalarField: function(name, label, value) {
			var field = new classes.ScalarField(name, label);
			this.addField(field);
			return field;
		},
		createTableField: function(name, label, columns, value) {
			var field = new classes.TableField(name, lable, columns, value);
			this.addField(field);
			return field;
		},
		del: function() {
			this.parent.removeLayout(this);
		},
	});
	
	classes.Board = Class.extend({
		init: function(layouts, containerSelector, layoutsSelector, componentsSelector) {
			this.layouts = layouts || [];
			this.containerSelector = containerSelector || '#main';
			this.layoutsSelector = layoutsSelector || '#LayoutsToolbar > ul > li';
			this.componentsSelector = componentsSelector || '#ModelComponentsToolbar > ul > li';
		},
		addLayout: function(layout) {
			layout.parent = this;
			this.layouts.push(layout);
		},
		removeLayout: function(layout) {
			var index = this.layouts.indexOf(layout);
			if (index >= 0) {
				this.layouts.splice(index, 1);
			}
		}
	
	});
	return classes;
});
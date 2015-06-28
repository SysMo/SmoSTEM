var Stem = angular.module('Stem',['ngResource']);

// Page with model list
Stem.controller('ModelCollectionCtrl', function($scope, PageSettings, ModelService, ServerErrorHandler){
	$scope.models = ModelService.query(function(data) {
	}, ServerErrorHandler);
	// Open model editor
	$scope.editModel = function(model) {
		window.location.href = '/ModelEditor/' + model._id;
	}
	// Delete model on the server and reload models
	$scope.deleteModel = function(model) {
		model.$delete();
		$scope.models = ModelService.query(function(data) {
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
	// Get the model object from the server
	$scope.model =  ModelService.get({_id: PageSettings.modelID}, function() {
		// Add the selectors for the different board parts
		angular.extend($scope.model.board, {
			containerSelector : '#main',
			layoutsSelector: '#LayoutsToolbar > ul > li',
			componentsSelector: '#ModelComponentsToolbar > ul > li'
		});
	});
	$scope.save = function() {
		$scope.model.$update();
	};
	$scope.compute = function() {
		$scope.model.$compute();
	};
	$scope.checkVal = function(modelId) {
		console.log(modelId);
		return true;
	}
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
	return $resource('/stem/api/Models/:_id', { _id: '@_id' }, 
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
		}
)});

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
		}
	});
	
	classes.ScalarField = classes.Field.extend({
		init: function(name, label, value) {
			this._super();
			this.type = 'stem.ScalarField'; 
			this.label = label || '';
			this.name = name || ('v' + (classes.ScalarField.instanceCounter + 1).toString());
			classes.ScalarField.instanceCounter++;
			this.value = value || 0;
		},
	});
	createInstanceCounter(classes.ScalarField);
	
	classes.TableField = classes.Field.extend({
		init: function(name, label, columns, value) {
			this._super();
			this.type = 'stem.TableField'; 
			this.label = label || '';
			this.name = name || ('T' + (classes.TableField.instanceCounter + 1).toString());
			classes.TableField.instanceCounter++;
			this.columns = columns || [{name : 'c1'}];
			this.value = value || [[0]];
		}
	});	
	createInstanceCounter(classes.TableField);
	
	classes.TextField = classes.Field.extend({
		init: function(name, label, value) {
			this._super();
			this.type = 'stem.TextField'; 
			this.label = label || '';
			this.name = name || ('Text' + (classes.TextField.instanceCounter + 1).toString());
			classes.TextField.instanceCounter++;
			this.value = value || '';
		}
	});	
	createInstanceCounter(classes.TextField);
	
	classes.FormulasField = classes.Field.extend({
		init: function(value) {
			this._super();
			this.type = 'stem.FormulasField';
			this.value = value || '';
		}
	});	
	
	classes.Layout = Class.extend({
		init: function(type, width, fields) {
			this.width = width || 'wide';
			this.type = type || 'grid';
			this.fields = fields || [];
			this.id = stemUtil.guid();
		}
	});
	
	return classes;
});

var Stem = angular.module('Stem',['ngResource']);

// Page with model list
Stem.controller('ModelCollectionCtrl', function($scope, PageSettings, StemResources, ServerErrorHandler){
	$scope.models = StemResources.Models.query(function(data) {
	}, ServerErrorHandler);
	// Open model editor
	$scope.editModel = function(model) {
		window.location.href = '/ModelEditor/' + model._id;
	}
	// Delete model on the server and reload models
	$scope.deleteModel = function(model) {
		model.$delete();
		$scope.models = StemResources.Models.query(function(data) {
		}, ServerErrorHandler);	}
	// Create a new model and open model editor
	$scope.createModel = function(model) {
		var model = new StemResources.Models();
		model.$save(function() {
			window.location.href = '/ModelEditor/' + model._id;	
		});
		
	}
});

// Page with model editor
Stem.controller('ModelEditorCtrl', function($scope, 
		PageSettings, StemResources, ServerErrorHandler, StemQuantities){
	// Get the model object from the server
	$scope.model =  StemResources.Models.get({_id: PageSettings.modelID}, function() {
		// Add the selectors for the different board parts
		angular.extend($scope.model.board, {
			containerSelector : '#main',
			layoutsSelector: '#LayoutsToolbar > ul > li',
			componentsSelector: '#ModelComponentsToolbar > ul > li'
		});
	}, ServerErrorHandler);
	
	StemQuantities.loadQuantities();
	$scope.quantities = StemQuantities.quantities;
	
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
		$('#errorModal .modal-body').html('Error description. '.repeat(15));
		$('#errorModal').modal("show");
	}
});

// Utility functions
Stem.factory('stemUtil', function stemUtil () {
	return {
		guid: function () {
		    function _p8(s) {
		        var p = (Math.random().toString(16)+"000000000").substr(2,8);
		        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
		    }
		    return _p8() + _p8(true) + _p8(true) + _p8();
		},
		formatNumber: function (n) {
			if (n == 0) {
				return "0";
			}
			if (Math.abs(n) < 1e-80){
				return "0";
			}
			if (Math.abs(n) > 1e5 || Math.abs(n) < 1e-3) {
				return n.toExponential(5);
			}
			var sig = 6;
			var mult = Math.pow(10,
					sig - Math.floor(Math.log(Math.abs(n)) / Math.LN10) - 1);
			return String(Math.round(n * mult) / mult);
		}
	};
})

// Quantities
Stem.factory('StemQuantities', function StemQuantities (StemResources, ServerErrorHandler, $timeout) {
	var StemQuantities = {
		quantities: {},
		loadQuantities: function() {
			this.quantities = StemResources.Quantities.load(function(data) {
			}, ServerErrorHandler);
		},
		getUnitDefinition: function(quantity, unitName) {
			var unitDef;
			var unitList = this.quantities[quantity].units
			for (var i = 0; i < unitList.length; i++) {
				if (unitList[i][0] == unitName) {
					unitDef = unitList[i][1];
					break;
				}					
			}
			return unitDef;
		},
		toSIUnit: function(quantity, unit, value) {
			var SIValue;
			var unitDefinition = this.getUnitDefinition(quantity, unit)
			SIValue = value * unitDefinition.mult + (unitDefinition.offset || 0)
			return SIValue
		},
		fromSIUnit: function(quantity, unit, SIValue) {
			var value;
			var unitDefinition = this.getUnitDefinition(quantity, unit)
			value = (SIValue - (unitDefinition.offset || 0)) / unitDefinition.mult
			return value;
		},
	};
	return StemQuantities;
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
			this.quantity = 'Dimensionless';
			this.displayUnit = '-';
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

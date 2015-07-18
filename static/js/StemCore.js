var Stem = angular.module('Stem',['ngResource', 'ui.bootstrap', 'ngAnimate',
                                  'ngSanitize', 'ngToast', 'ngCookies']);

Stem.config(['ngToastProvider', function(ngToast) {
    ngToast.configure({
      //verticalPosition: 'bottom',
      //horizontalPosition: 'center'
    });
 }]);

// Utility functions
Stem.factory('StemUtil', function StemUtil () {
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
		},
		numeralFormat: function(format, value) {
			return format ? numeral(value).format(format) : numeral(value).value();
		}
	};
})

// Quantities
Stem.factory('StemQuantities', function StemQuantities (StemResources, $timeout) {
	var StemQuantities = {
		quantities: {},
		loadQuantities: function(cb) {
			var quantityList = StemResources.Quantities.load(function (data) {
				quantityList.forEach(function(value, index) {
					StemQuantities.quantities[value.name] = value;
				});
				cb(StemQuantities.quantities);
			});
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

// Library modules
Stem.factory('StemLibraryModules', function StemLibraryModules (StemResources, $timeout) {
	var StemLibraryModules = {
		libraryModules: {},
		loadLibraryModules: function(cb) {
			var libraryModuleList = StemResources.LibraryModules.load(function (data) {
				libraryModuleList.forEach(function(value, index) {
					StemLibraryModules.libraryModules[value.name] = value;
				});
				cb(StemLibraryModules.libraryModules);
			});
		}
	};
	return StemLibraryModules;
});

Stem.filter('getLibNamespace', function () {
	return function (func, lib) {
		if (lib.importName) {
			return lib.importName + '.' + func.signature;
		} else {
			return func.signature;
		}
	};
});

// User defined 'Classes'
Stem.factory('stemClasses', function stemClasses(StemUtil) {
	var classes = {};
	function createInstanceCounter(klass) {
		klass.instanceCounter = 0;
	}
	
	classes.Field = Class.extend({
		type: 'stem.Field',
		init: function () {
			// Create unique id
			this.id = StemUtil.guid();			
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
		init: function(name, label, value) {
			this._super();
			this.type = 'stem.FormulasField';
			this.label = label || '';
			this.name = name || ('Formulas' + (classes.FormulasField.instanceCounter + 1).toString());
			classes.FormulasField.instanceCounter++;
			this.value = value || '';
		}
	});	
	createInstanceCounter(classes.FormulasField);
	
	classes.Layout = Class.extend({
		init: function(type, width, fields, title, image) {
			this.width = width || 'wide';
			this.type = type || 'grid';
			this.fields = fields || [];
			this.id = StemUtil.guid();
			this.title =  title || "New layout";
			this.image =  image;
		}
	});
	
	return classes;
});

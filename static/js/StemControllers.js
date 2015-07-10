// Page with quantities list
Stem.controller('QuantitiesCtrl', function($scope, StemResources, Menus) {
	$scope.Quantities = new StemResources.StandardResource('Quantities', 'QuantityEditor');
	$scope.Quantities.query();
	Menus.addMenuItem('topbar', 'New', $scope.Quantities.create, 'action');
});

//Editor for an individual quantity
Stem.controller('QuantityEditorCtrl', function($scope, PageSettings, StemResources, StemUtil, Menus) {
	// Add a link to the Quantities collection
	Menus.addMenuItem('topbar', 'Quantities', '/Quantities');
	// Used for string representation of numerical values
	$scope.multiplierStrings = [];
	// Fetch the quantity information
	$scope.quantity =  StemResources.Quantities.get({_id: PageSettings.quantityID}, 
			function() {
		for (var i = 0; i < $scope.quantity.units.length; i++) {
			$scope.multiplierStrings.push(StemUtil.formatNumber($scope.quantity.units[i][1].mult));
		}
	});
	// Add a new unit
	$scope.addUnit = function(index) {
		$scope.quantity.units.splice(index, 0, ["", {mult:1, offset:0}]);
	};
	// Delete unit
	$scope.deleteUnit = function(index) {
		$scope.quantity.units.splice(index, 1);
	};
	// When multiplier value change (convert text to number)
	$scope.onMultiplierChange = function(index) {
		var value = parseFloat($scope.multiplierStrings[index]);
		if (!isNaN(value)) {
			$scope.quantity.units[index][1].mult = value;	
		}
	};
	// Save quantity definition
	$scope.save = function() {
		$scope.quantity.$update();
	};
	Menus.addMenuItem('topbar', 'Save', $scope.save, 'action', 'glyphicon-floppy-disk');
});

//Page with model list
Stem.controller('ModelCollectionCtrl', function($scope, PageSettings, StemResources, Menus){
	$scope.Models = new StemResources.StandardResource('Models', 'ModelEditor');
	$scope.Models.query();
	Menus.addMenuItem('topbar', 'New', $scope.Models.create, 'action');
});

// Page with model editor
Stem.controller('ModelEditorCtrl', function($scope, 
		PageSettings, StemResources, StemQuantities, StemLibraryModules, Menus){
	// Add a link to the Models collection
	Menus.addMenuItem('topbar', 'Models', '/Models');
	// Get the model object from the server
	$scope.model =  StemResources.Models.get({_id: PageSettings.modelID}, function() {
		// Add the selectors for the different board parts
	});
	// Load quantities from server
	$scope.quantitiesLoaded = false;
	StemQuantities.loadQuantities(function(quantities){
		$scope.quantities = quantities;
		$scope.quantitiesLoaded = true;
	});
	// Load library modules from server
	$scope.libraryModulesLoaded = false;
	StemLibraryModules.loadLibraryModules(function(libraryModules){
		$scope.libraryModules = libraryModules;
		console.log($scope.libraryModules);
		$scope.libraryModulesLoaded = true;
	});
	// Compute model
	$scope.compute = function() {
		$scope.model.$compute();
	};
	Menus.addMenuItem('topbar', 'Compute', $scope.compute, 'action', 'glyphicon glyphicon-play-circle');
	// Save model
	$scope.save = function() {
		$scope.model.$update();
	};
	Menus.addMenuItem('topbar', 'Save', $scope.save, 'action', 'glyphicon-floppy-disk');
	// Edit basic model properties
	$scope.editProps = function() {
		$("#" + $scope.model._id + "-modal").modal();
	}
	Menus.addMenuItem('topbar', 'Properties', $scope.editProps, 'action', 'glyphicon glyphicon-cog');
});

//Page with library modules
Stem.controller('LibraryModuleCollectionCtrl', function($scope, PageSettings, StemResources, Menus){
	$scope.LibraryModules = new StemResources.StandardResource('LibraryModules', 'LibraryModuleEditor');
	$scope.LibraryModules.query();
	Menus.addMenuItem('topbar', 'New', $scope.LibraryModules.create, 'action', 'glyphicon glyphicon-plus');
});

//Editor for an individual quantity
Stem.controller('LibraryModuleEditorCtrl', function($scope, $timeout, PageSettings, StemResources, StemUtil, Menus) {
	// Add a link to the LibraryModules collection
	Menus.addMenuItem('topbar', 'Modules', '/LibraryModules');
	$scope.module = StemResources.LibraryModules.get({_id: PageSettings.moduleID});
	// Create a new function
	$scope.addFunction = function() {
		$scope.module.functions.push({
			name: '',
			description: '',
			arguments: []
		});
		var index = $scope.module.functions.length - 1;
		console.log($scope.module.functions[index]);
		$timeout(function(){$scope.editFunction(index);});
		//$timeout($scope.editFunction();
		
	};
	Menus.addMenuItem('topbar', 'New function', $scope.addFunction, 'action', 'glyphicon glyphicon-plus');
	// Delete function
	$scope.deleteFunction = function(index) {
		$scope.module.functions.splice(index, 1);
	};
	// Edit function
	$scope.editFunction = function(index) {
		$('#function-' + index + '-modal').modal();
	};
	
	// Add function argument
	$scope.addFunctionArgument = function(func, index) {
		func.arguments.splice(index, 0, {
			name: '',
			description: '',
		});
	}
	$scope.deleteFunctionArgument = function(func, index) {
		func.arguments.splice(index, 1);
	}

	// Save module
	$scope.save = function() {
		$scope.module.$update()
	}
	Menus.addMenuItem('topbar', 'Save', $scope.save, 'action', 'glyphicon-floppy-disk');
});

Stem.controller('HeaderController', ['$scope', 'Menus',
		 function($scope, Menus) {
	// Set top bar menu items
	Menus.addMenuItem('topbar', 'Go To', 'GoTo', 'dropdown');
	Menus.addSubMenuItem('topbar', 'GoTo', 'Models', '/Models');
	Menus.addSubMenuItem('topbar', 'GoTo', 'Quantities', '/Quantities');
	Menus.addSubMenuItem('topbar', 'GoTo', 'Library Modules', '/LibraryModules');

	$scope.isCollapsed = false;
	$scope.menu = Menus.getMenu('topbar');
	
	$scope.toggleCollapsibleMenu = function() {
		$scope.isCollapsed = !$scope.isCollapsed;
	};
	// Collapsing the menu after navigation
	$scope.$on('$stateChangeSuccess', function() {
   			$scope.isCollapsed = false;
   	});
	// Activate tooltips
	$('[data-toggle="tooltip"]').tooltip();
}]);
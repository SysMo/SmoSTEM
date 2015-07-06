// Page with quantities list
Stem.controller('QuantitiesCtrl', function($scope, StemResources) {
	$scope.Quantities = new StemResources.StandardResource('Quantities', 'QuantityEditor');
	$scope.Quantities.query();
});

//Editor for an individual quantity
Stem.controller('QuantityEditorCtrl', function($scope, PageSettings, StemResources, StemUtil) {
	// Used for string representation of numerical values
	$scope.multiplierStrings = [];
	// Fetch the quantity information
	$scope.quantity =  StemResources.Quantities.get({id: PageSettings.quantityID}, 
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
	// Go to the list of quantities
	$scope.listQuantities = function() {
		window.location.href = "/Quantities";
	};
});

//Page with model list
Stem.controller('ModelCollectionCtrl', function($scope, PageSettings, StemResources){
	$scope.Models = new StemResources.StandardResource('Models', 'ModelEditor');
	$scope.Models.query();
});

// Page with model editor
Stem.controller('ModelEditorCtrl', function($scope, 
		PageSettings, StemResources, StemQuantities){
	// Get the model object from the server
	$scope.model =  StemResources.Models.get({_id: PageSettings.modelID}, function() {
		// Add the selectors for the different board parts
		angular.extend($scope.model.board, {
			containerSelector : '#main',
			layoutsSelector: '#LayoutsToolbar > ul > li',
			componentsSelector: '#ModelComponentsToolbar > ul > li'
		});
	});
	// Load quantities from server
	$scope.quantitiesLoaded = false
	StemQuantities.loadQuantities(function(quantities){
		$scope.quantities = quantities;
		$scope.quantitiesLoaded = true;
		console.log($scope.quantities);
	});
	// Save model
	$scope.save = function() {
		$scope.model.$update();
	};
	// Compute model
	$scope.compute = function() {
		$scope.model.$compute();
	};
	//??
	$scope.checkVal = function(modelId) {
		console.log(modelId);
		return true;
	}
});

//Page with library modules
Stem.controller('LibraryModuleCollectionCtrl', function($scope, PageSettings, StemResources){
	$scope.LibraryModules = new StemResources.StandardResource('LibraryModules', 'LibraryModuleEditor');
	$scope.LibraryModules.query();
});
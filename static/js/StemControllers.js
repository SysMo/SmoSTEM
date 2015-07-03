// Page with quantities list
Stem.controller('QuantitiesCtrl', function($scope, StemResources) {
	$scope.Quantities = new StemResources.StandardResource('Quantities', 'QuantityEditor');
	$scope.Quantities.query();
});

//Editor for an individual quantity
Stem.controller('QuantityEditorCtrl', function($scope, PageSettings, StemResources, stemUtil) {
	// Used for string representation of numerical values
	$scope.multiplierStrings = [];
	// Fetch the quantity information
	$scope.quantity =  StemResources.Quantities.get({id: PageSettings.quantityID}, 
			function() {
		for (var i = 0; i < $scope.quantity.units.length; i++) {
			$scope.multiplierStrings.push(stemUtil.formatNumber($scope.quantity.units[i][1].mult));
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
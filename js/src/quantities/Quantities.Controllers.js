/*
 * QuantitiesCtrl: manager for quantities
 */
Stem.controller('QuantitiesCtrl', ['$scope', 'StemResources', 'MenuService',  	
	function($scope, StemResources, MenuService) {
		$scope.Quantities = new StemResources.StandardResource('Quantities', 'QuantityEditor');
		$scope.Quantities.query();
		
		// Manage menu items
		MenuService.addMenuItem('mainMenu', 'New', $scope.Quantities.create, 'action', 'glyphicon-plus');
	}
]);

/*
 * QuantityEditorCtrl: editor for an individual quantity
 */
Stem.controller('QuantityEditorCtrl', ['$scope', 'PageSettings', 'StemResources', 'StemUtil', 'MenuService', 
    function($scope, PageSettings, StemResources, StemUtil, MenuService) {
		// Fetch the quantity information
		$scope.quantity =  StemResources.Quantities.get({_id: PageSettings.quantityID});
		
		// Add a new unit
		$scope.addUnit = function(index) {
			$scope.quantity.units.splice(index, 0, ["", {mult:1, offset:0}]);
		};
		
		// Delete unit
		$scope.deleteUnit = function(index) {
			$scope.quantity.units.splice(index, 1);
		};
		
		// Save quantity definition
		$scope.save = function() {
			$scope.quantity.$update();
		};

		// Manage menu items
		MenuService.addMenuItem('mainMenu', 'Quantities', '/Quantities');
		MenuService.addMenuItem('mainMenu', 'Save', $scope.save, 'action', 'glyphicon-floppy-disk');
	}
]);
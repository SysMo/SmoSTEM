/*
 * ModelPropertiesCtrl: editor for model properties
 */
Stem.controller('ModelPropertiesCtrl', ['$scope', '$modalInstance', 'model', 
    function($scope, $modalInstance, model) {
		$scope.model = model;
		$scope.ok = function () {
			$modalInstance.close();
		};
	}
]);

/*
 * ModelUserAccessCtrl: editor for a model user access
 */
Stem.controller('ModelUserAccessCtrl', ['$scope', '$modalInstance', 'items', 'model',
	function ($scope, $modalInstance, items, model) {
		$scope.model = model;
		$scope.items = items;
		
		$scope.linkToShare = window.location.href;
		
		$scope.selected = {
			item: $scope.items[0]
		};
	
		$scope.ok = function () {
			$modalInstance.close($scope.selected.item);
		};
	
		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	}
]);
/**
 * ModelPropertiesCtrl: editor for model properties
 */
Stem.controller('ModelPropertiesCtrl', ['$scope', '$modalInstance', 'model', 'updateDisplay',
    function($scope, $modalInstance, model, updateDisplay) {
		$scope.model = model;
		$scope.ok = function () {
			$modalInstance.close();
			updateDisplay();
		};
	}
]);

/**
 * LayoutPropertiesCtrl: editor for layout properties
 */
Stem.controller('LayoutPropertiesCtrl', ['$scope', '$modalInstance', 'layout', 
    function($scope, $modalInstance, layout) {
		$scope.layout = layout;
		$scope.ok = function () {
			$modalInstance.close();
		};
	}
]);

/**
 * ModelUserAccessCtrl: editor for a model user access
 */
Stem.controller('ModelUserAccessCtrl', ['$scope', '$modalInstance', 'StemResources', 'model',
	function ($scope, $modalInstance, StemResources, model) {
		$scope.model = model;
		
		$scope.modelPublicAccess = {
			availableAccesses: StemResources.getModelPublicAccesses(),
			selectedAccess: StemResources.modelPublicAccessID2Txt($scope.model.publicAccess)
		};
		
		$scope.modelUserAccess = {
			userAccesses: StemResources.ModelUserAccess.get({modelID: $scope.model._id}), 
		};
		
		$scope.ok = function () {
			$modalInstance.close($scope.modelPublicAccess.selectedAccess);
		};
	
		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	}
]);
/*
 * LibraryModulesCtrl: manager for library modules
 */
Stem.controller('LibraryModulesCtrl', ['$scope', 'PageSettings', 'StemResources', 'MenuService',
	function($scope, PageSettings, StemResources, MenuService){
		$scope.LibraryModules = new StemResources.StandardResource('LibraryModules', 'LibraryModuleEditor');
		$scope.LibraryModules.query();
		
		// Manage menu items
		MenuService.addMenuItem('mainMenu', 'New', $scope.LibraryModules.create, 'action', 'glyphicon-plus');
	}
]);

/*
 * LibraryModuleEditorCtrl: editor for an individual library module
 */
Stem.controller('LibraryModuleEditorCtrl', ['$scope', '$timeout', 'PageSettings', 'StemResources', 'StemUtil', 'MenuService', 
	function($scope, $timeout, PageSettings, StemResources, StemUtil, MenuService) {
		// Get the library module object from the server
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
		};
		
		// Delete function argument
		$scope.deleteFunctionArgument = function(func, index) {
			func.arguments.splice(index, 1);
		};
	
		// Save module
		$scope.save = function() {
			$scope.module.$update();
		};
		
		// Manage menu items
		MenuService.addMenuItem('mainMenu', 'Modules', '/LibraryModules');
		MenuService.addMenuItem('mainMenu', 'New function', $scope.addFunction, 'action', 'glyphicon-plus');
		MenuService.addMenuItem('mainMenu', 'Save', $scope.save, 'action', 'glyphicon-floppy-disk');
	}
]);
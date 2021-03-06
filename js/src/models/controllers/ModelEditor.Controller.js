/*
 * ModelEditorCtrl: editor for an individual model
 */
Stem.controller('ModelEditorCtrl', ['$scope', '$modal', '$timeout', 'PageSettings', 'StemResources', 'StemQuantities', 'StemLibraryModules', 'MenuService',
	function($scope, $modal, $timeout, PageSettings, StemResources, StemQuantities, StemLibraryModules, MenuService){		
		// Updates the model vision based on settings
		$scope.updateDisplay = function() { 
			if (angular.isString($scope.model.background) && $scope.model.background.length > 0) {
				$("body").css("background-image", "url('" + $scope.model.background + "')");
			} else {
				$("body").css("background-image", "none");
			}
		};

		// Get the model object from the server
		$scope.model =  StemResources.Models.get({_id: PageSettings.modelID}, function() {
			$timeout($scope.updateDisplay);
		});
		
		// Load quantities from the server
		$scope.quantitiesLoaded = false;
		StemQuantities.loadQuantities(function(quantities){
			$scope.quantities = quantities;
			$scope.quantitiesLoaded = true;
		});
		
		// Load library modules from the server
		$scope.libraryModulesLoaded = false;
		StemLibraryModules.loadLibraryModules(function(libraryModules){
			$scope.libraryModules = libraryModules;
			$scope.libraryModulesAccordionObj = {};
			angular.forEach($scope.libraryModules, function(lib, key) {
				$scope.libraryModulesAccordionObj[key] = {};
				$scope.libraryModulesAccordionObj[key].importName = lib.importName;
				$scope.libraryModulesAccordionObj[key].functions = [];
				angular.forEach(lib.functions, function(func, index) {
					var signatureString = "";
					signatureString += func.name;
					signatureString += "(";
					angular.forEach(func.arguments, function(argument, index) {
						if (index == func.arguments.length - 1) {
							signatureString += argument.name;
						} else {
							signatureString += argument.name + ", ";
						}
					});
					signatureString += ")";
					$scope.libraryModulesAccordionObj[key].functions.push({"signature": signatureString, "description": func.description, "arguments": func.arguments});
				});
			});
			$scope.libraryModulesLoaded = true;
		});
		
		// Compute model
		$scope.compute = function() {
			$scope.model.$compute();
		};
		
		// Save model
		$scope.save = function() {
			$scope.model.$update();
		};
		
		// Edit model properties
		$scope.editProps = function() {
			var modalInstance = $modal.open({
				animation: true,
				templateUrl: 'stem-model-properties.html',
				controller: 'ModelPropertiesCtrl',
				size: 'lg', //large
				resolve : {
					model: function () {return $scope.model;},
					updateDisplay: function() {return $scope.updateDisplay;}
				}
			});
		};
		
		// Edit model user access
        $scope.animationsEnabled = true;
		$scope.share = function () {
			var modalInstance = $modal.open({
				animation: $scope.animationsEnabled,
				templateUrl: 'stem-modal-user-access.html',
				controller: 'ModelUserAccessCtrl',
				size: 'lg', //large
				resolve: {
					model: function () {return $scope.model;}
				}
			});
			
			modalInstance.result.then(
				function (newModelPublicAccess) {
					// Set the new public access of the model					
					var newModelPublicAccessID = StemResources.modelPublicAccessTxt2ID(newModelPublicAccess);
					var currModelPublicAccessID = $scope.model.publicAccess;
					if (newModelPublicAccessID != currModelPublicAccessID){
						$scope.model.publicAccess = newModelPublicAccessID;
						$scope.model.$update();
					}
					
					//:WORK: Set the new user accesses of the model
					//StemResources.ModelUserAccess.delete({modelID: $scope.model._id, username: 'mborisov81'}); //:WORK: 
			    }, 
			    function () {
			    	//console.log('Modal Dialog: "Model User Access" dismissed at: ' + new Date());
			    }
			);
		};
		
		// Manage menu items
		MenuService.addMenuItem('mainMenu', 'Models', '/Models');
		MenuService.addMenuItem('mainMenu', 'Compute', $scope.compute, 'action', 'glyphicon-play-circle');
		MenuService.addMenuItem('mainMenu', 'Save', $scope.save, 'action', 'glyphicon-floppy-disk');
		MenuService.addMenuItem('mainMenu', 'Properties', $scope.editProps, 'action', 'glyphicon-cog');
		MenuService.addMenuItem('mainMenu', 'Share', $scope.share, 'action', 'glyphicon-share');
	}
]);

/*
 * ModelsCtrl: manager for models
 */
Stem.controller('ModelsCtrl', ['$scope', 'PageSettings', 'StemResources', 'MenuService', 'UserService',
    function($scope, PageSettings, StemResources, MenuService, UserService){
		// Create a new model
		$scope.editorPath = "ModelEditor";
		$scope.create = function() {
			var model = new StemResources.Models();
			model.$create(function() {
				window.location.href = $scope.editorPath + "/" + model._id;
			});
		};
		
		// Delete model 
		$scope.del = function(model) {
			model.$delete(function () {
				loadModels();	
			});
		};
		
		// Duplicate model
		$scope.duplicate = function(model) {
			model.$clone(function() {
				// Tricky: should update the view only after we know the delete function has completed
				window.location.href = $scope.editorPath + "/" + model._id;
			});
		};
		
		// Edit model
		$scope.edit = function(model) {
			window.location.href = $scope.editorPath + "/" + model._id;
		};
		
		// Load models
		function loadModels() {
			var userIsAdmin = UserService.isAdmin();
			var userIsAuthenticated = UserService.isAuthenticated();
			
			// Load models - "Public models"
			$scope.publicModels = StemResources.Models.query({modelUserRelation: 'public'});
			
			$scope.listedModelsTabs = [
		       { title:'Public models', models:$scope.publicModels, active:true }
			];
			
			// Load models - "My models" and "Models shared with me"
			if (userIsAuthenticated) {
				$scope.myModels = StemResources.Models.query({modelUserRelation: 'own'});
				$scope.sharedModels = StemResources.Models.query({modelUserRelation: 'shared'});
				
				$scope.listedModelsTabs.push(
					{ title:'My models', models:$scope.myModels, active:true},
					{ title:'Models shared with me', models:$scope.sharedModels, active:false}
				);
				
				$scope.listedModelsTabs[0].active = false; //Public models
			}
			
			// Load models - "All models"
			if (userIsAdmin) {
				$scope.allModels = StemResources.Models.query({modelUserRelation: 'all'});
				
				$scope.listedModelsTabs.push(
					{ title:'All models', models:$scope.allModels, active:false }
				);
			}
		}
		
		// Load models
		loadModels();
		
		// Manage menu items
		if (UserService.isAuthenticated()) {
			MenuService.addMenuItem('mainMenu', 'New', $scope.create, 'action', 'glyphicon-plus');
		}
	}
]);

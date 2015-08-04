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

/*
 * ModelsCtrl: manager for models
 */
Stem.controller('ModelsCtrl', ['$scope', 'PageSettings', 'StemResources', 'MenuService', 'UserService',
    function($scope, PageSettings, StemResources, MenuService, UserService){
		// Create a new model
		$scope.editorPath = "ModelEditor"
		$scope.create = function() {
			var model = new StemResources.Models();
			model.$create(function() {
				window.location.href = $scope.editorPath + "/" + model._id;
			});
		}
		
		// Delete model 
		$scope.del = function(model) {
			model.$delete();
			loadModels();		
		}
		
		// Duplicate model
		$scope.duplicate = function(model) {
			entity.$clone(function() {
				window.location.href = $scope.editorPath + "/" + model._id;
			});
		}
		
		// Edit model
		$scope.edit = function(model) {
			window.location.href = $scope.editorPath + "/" + model._id;
		}
		
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

/*
 * ModelEditorCtrl: editor for an individual model
 */
Stem.controller('ModelEditorCtrl', ['$scope', 'PageSettings', 'StemResources', 'StemQuantities', 'StemLibraryModules', 'MenuService',
	function($scope, PageSettings, StemResources, StemQuantities, StemLibraryModules, MenuService){		
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
			$scope.libraryModulesAccordionObj = {};
			angular.forEach($scope.libraryModules, function(lib, key) {
				$scope.libraryModulesAccordionObj[key] = {};
				$scope.libraryModulesAccordionObj[key].importName = lib.importName;
				$scope.libraryModulesAccordionObj[key].functions = [];
				angular.forEach(lib.functions, function(func, index) {
					var signatureString = "";
					signatureString += func.name
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
			$("#" + $scope.model._id + "-modal").modal();
		}
		
		// Manage menu items
		MenuService.addMenuItem('mainMenu', 'Models', '/Models');
		MenuService.addMenuItem('mainMenu', 'Compute', $scope.compute, 'action', 'glyphicon-play-circle');
		MenuService.addMenuItem('mainMenu', 'Save', $scope.save, 'action', 'glyphicon-floppy-disk');
		MenuService.addMenuItem('mainMenu', 'Properties', $scope.editProps, 'action', 'glyphicon-cog');
	}
]);

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
		}
		
		// Delete function argument
		$scope.deleteFunctionArgument = function(func, index) {
			func.arguments.splice(index, 1);
		}
	
		// Save module
		$scope.save = function() {
			$scope.module.$update()
		}
		
		// Manage menu items
		MenuService.addMenuItem('mainMenu', 'Modules', '/LibraryModules');
		MenuService.addMenuItem('mainMenu', 'New function', $scope.addFunction, 'action', 'glyphicon-plus');
		MenuService.addMenuItem('mainMenu', 'Save', $scope.save, 'action', 'glyphicon-floppy-disk');
	}
]);

/*
 * NavbarCtrl: manager for the navbar/menus 
 */
Stem.controller('NavbarCtrl', ['$scope', 'MenuService', 'UserService', 'StemResources', 
    function($scope, MenuService, UserService, StemResources) {
		// Manage MainMenu
		$scope.mainMenu = MenuService.addMenu('mainMenu');
		
		MenuService.addMenuItem('mainMenu', 'Go To', 'GoTo', 'dropdown');
		MenuService.addSubMenuItem('mainMenu', 'GoTo', 'Models', '/Models');
		MenuService.addSubMenuItem('mainMenu', 'GoTo', 'Quantities', '/Quantities');
		MenuService.addSubMenuItem('mainMenu', 'GoTo', 'Library Modules', '/LibraryModules');
		
		// Manage RightMenu
		$scope.rigthMenu = MenuService.addMenu('rightMenu');
		if (UserService.isAuthenticated()) {
			MenuService.addMenuItem('rightMenu', UserService.username(), '', 'item');
			MenuService.addMenuItem('rightMenu', 'Logout', UserService.logout, 'action');
		} else {
			MenuService.addMenuItem('rightMenu', 'Login', UserService.login, 'action');
			MenuService.addMenuItem('rightMenu', 'Register', UserService.register, 'action');
		}
	}
]);

/*
 * LoginCtrl: user login manager 
 */
Stem.controller('LoginCtrl', ['StemResources',
    function(StemResources) {
		var emailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		$('#LoginModal form').submit(function() {
			var errorFlag = false;
			$('#loginMessage').empty();
			
			if (!emailRegExp.test($('#loginInputEmail').val())) {
				$('#loginMessage').append("<div>Email address must be valid</div>");
				errorFlag = true;
			}
			
			if (errorFlag) {
				return;
			}
			
			StemResources.Users.login({
				id: $('#loginInputEmail').val(), 
				password: $('#loginInputPassword').val()
				}, 
				function () {
					$('#loginInputPassword').val("");
					$('#LoginModal').modal("hide");
					location.reload();
				}, 
				function(response) {
					$('#loginMessage').append("<div>" + response.data.msg + "</div>");
				}
			);			
		});	
	}
]);

/*
 * RegisterCtrl: user register manager
 */
Stem.controller('RegisterCtrl', ['$scope', 'StemResources', 
	function($scope, StemResources){
		$(document).ready(function () {
			var emailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			
			$('#RegisterForm').submit(function() {
				var errorFlag = false;
				$('#registrationMessage').empty();
				
				if (!emailRegExp.test($('#RegisterForm #inputEmail').val())) {
					$('#registrationMessage').css("color", "red").append("<div>Email address must be valid</div>");
					errorFlag = true;
				}
				
				if ($('#RegisterForm #inputPassword').val() != $('#RegisterForm #confirmPassword').val()) {
					$('#registrationMessage').css("color", "red").append("<div>Passwords don't match</div>");
					errorFlag = true;
				}
				
				if (errorFlag) {
					return;
				}
				
				StemResources.Users.create({
					    username: $('#RegisterForm #inputUserName').val(), 
						email: $('#RegisterForm #inputEmail').val(), 
						firstName: $('#RegisterForm #inputFirstName').val(),
						lastName: $('#RegisterForm #inputLastName').val(),
						country: $('#RegisterForm #inputCountry').val(),
						organization: $('#RegisterForm #inputOrganization').val(),
						password: $('#RegisterForm #inputPassword').val()
					}, 
					function () {
						$('#registrationMessage').css("color", "green")
							.append('<div>You have successfully registered.</div>')
							.append('<div>You will receive an email with a link to confirm your registration.</div>')
							.append('<div style="color: black; margin-top: 5px;">Go to <a href="/Models">Models</a></div>');
					},
					function(response) {
						$('#registrationMessage').css("color", "red").append("<div>" + response.data.msg + "</div>");
					}
				);			
			});
		});
	}
]);
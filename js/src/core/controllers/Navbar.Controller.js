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
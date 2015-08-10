/*
 * User service used for managing  users
 * IMPORTANT: $cookie interface changes in angular 1.4
 */
Stem.service('UserService', ['$cookies', 'StemResources', function($cookies, StemResources) {
	this.username = function() {
		return $cookies['user.username'];
	};
	
	this.roles = function() {
		if ($cookies['user.roles'] === undefined) {
			return [];
		} else {
			return $cookies['user.roles'].split('-');
		}
	};
	
	this.isAuthenticated = function() {
		var username = this.username();
		if (username && username.length > 0) {
			return true;
		} else {
			return false;
		}
	};
	
	this.isAdmin = function() {
		return this.roles().indexOf('admin') >= 0;
	};
	
	this.login = function() {
		$('#LoginModal').modal("show");
	};
	
	this.logout = function() {
		StemResources.Users.logout(function () {
			location.reload();
		});
	};
	
	this.register = function() {
		window.location.href = "/register";
	};
}]);
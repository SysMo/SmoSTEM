//User service used for managing  users

// IMPORTANT: $cookie interface changes in angular 1.4
Stem.service('UserService', ['$cookies', 'StemResources',
	function($cookies, StemResources) {
		this.currentUser = function() {
			return $cookies.username;
		}
		this.isAuthenticated = function() {
			return $cookies.username && $cookies.username.length > 0;
		}
		this.username = function() {
			return $cookies.username;
		}
		this.login = function() {
			$('#LoginModal').modal("show");
		}
		this.logout = function() {
			StemResources.Users.logout();
		}
		this.register = function() {
			window.location.href = "/register";
		}
	}
]);
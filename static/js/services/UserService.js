//User service used for managing  users

// IMPORTANT: $cookie interface changes in angular 1.4
Stem.service('UserService', ['$cookies', 'StemResources',
	function($cookies, StemResources) {
		this.username = function() {
			return $cookies['user.username'];
		}
		this.roles = function() {
			return $coolies['user.roles'].split('-');
		}
		this.isAuthenticated = function() {
			var username = this.username();
			return username && username.length > 0;
		}
		this.isAdmin = function() {
			return 'admin' in this.roles();
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
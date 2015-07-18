//User service used for managing  users

// IMPORTANT: $cookie interface changes in angular 1.4
Stem.service('UserService', ['$cookies', 'StemResources',
	function($cookies, StemResources) {
		this.currentUser = function() {
			return $cookies.username;
		}
		this.isAuthenticated = function() {
			return $cookies.username.length > 0;
		}
		this.username = function() {
			return $cookies.username;
		}
		this.login = function() {
			$('#LoginModal form').submit(function() {
				StemResources.Users.login({
						id: $('#LoginModal #inputEmail').val(), 
						password: $('#LoginModal #inputPassword').val()
						}, function () {
							$('#LoginModal').modal("hide");
						} 
					);			
			});
			
			$('#LoginModal').modal("show");
		}
		this.logout = function() {
			StemResources.Users.logout();
		}
		this.create = function() {
		}
	}
]);
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
Stem.directive('stemModal', [function() {
	return {
		restrict : 'A',
		scope : {
			stemModel : '=model'
		},
		templateUrl: "stem-modal.html",
	}
}]);

Stem.directive('stemBoard', function(stemClasses) {
	return {
		restrict: 'A',
		scope: {
			stemBoard: '=',
		},
		templateUrl: "stem-board.html",
		controller: function($scope) {
			$scope.addLayout = function(layout) {
				$scope.stemBoard.layouts.push(layout);
				$($scope.stemBoard.containerSelector).height($($scope.stemBoard.containerSelector).height() + 520);
			},
			$scope.removeLayout = function(layout) {
				var index = $scope.stemBoard.layouts.indexOf(layout);
				if (index >= 0) {
					$scope.stemBoard.layouts.splice(index, 1);
					$($scope.stemBoard.containerSelector).height($($scope.stemBoard.containerSelector).height() - 520);
				}
			}			
		},
		link: function (scope, element, attributes) {
			// Initialize droppable board
			$(scope.stemBoard.containerSelector).droppable({
				accept: scope.stemBoard.layoutsSelector,
				activeClass: 'droppable-hover',
				drop: function( event, ui ) {
					var layoutClassId = ui.draggable.context.id; // id of li element; is the same as component type
					$('#'+layoutClassId).draggable("option", "revert", false);
					var layout;
					switch (layoutClassId) {
					case 'grid_Wide':
						layout = new stemClasses.Layout('grid', 'wide');
						scope.addLayout(layout);
						break;
					case 'grid_Narrow':
						layout = new stemClasses.Layout('grid', 'narrow');
						scope.addLayout(layout);
						break;
					}
					scope.$apply();
				}
			});
			
			// Initialize set of draggable layouts
			$(scope.stemBoard.layoutsSelector).each(function(index, element){
				$(element)
				.draggable({
					appendTo: "body",
					cursor: "pointer",
					opacity: 0.5,
					helper: "clone",
					start: function(e, ui)
					{
						$(this).draggable("option", "revert", true);
						$(ui.helper).css("list-style-type", "none");
					},
				});
			});
			
			// Initialize set of draggable components
			$(scope.stemBoard.componentsSelector).each(function(index, element){
				$(element)
				.draggable({
					appendTo: "body",
					cursor: "pointer",
					opacity: 0.5,
					helper: "clone",
					start: function(e, ui)
					{
						$(this).draggable("option", "revert", true);
						$(ui.helper).css("list-style-type", "none");
					},
				});
			});
		}
	}
});

Stem.directive('stemLayout', function(stemClasses) {
	return {
		restrict : 'A',
		scope: {
			stemLayout: '=',
		},
		templateUrl: "stem-layout.html",
		replace: true,
		controller: function($scope) {
			$scope.addField = function(field) {
				$scope.stemLayout.fields.push(field);
			};
			$scope.removeField = function(field) {
				var index = $scope.stemLayout.fields.indexOf(field);
				if (index >= 0) {
					$scope.stemLayout.fields.splice(index, 1);
				}
			};
		},
		link: function(scope, element, attributes) {
			if (scope.stemLayout.width == 'narrow') {
				element.css('width', '500px');
			} else {
				element.css('width', '1020px');
			}
			element.droppable({
				accept: scope.$parent.stemBoard.componentsSelector,
				activeClass: 'droppable-hover',
				drop: function(event, ui) {
					var fieldClassId = ui.draggable.context.id; // id of li element; is the same as component type
					$('#'+fieldClassId).draggable("option", "revert", false);
					var field;
					switch (fieldClassId) {
					case 'fields_Scalar':
						field = new stemClasses.ScalarField(); 
						scope.addField(field);
						break;
					case 'fields_Table':
						field = new stemClasses.TableField();
						scope.addField(field);
						break;
					case 'fields_TextArea':
						field = new stemClasses.TextField();
						scope.addField(field);
						break;
					}
					scope.$apply();
				}
			});
			element.sortable({
				//items: 'div[stem-scalar], div[stem-table]',
				containment: "#" + scope.stemLayout.id,
				axis: "y",
				start: function(event, ui) {
					ui.item.startIndex = ui.item.index();
				},
				stop : function(event, ui) {
					// field being moved among sortables
					var field = scope.stemLayout.fields[ui.item.startIndex - 1];
					// modifying the layout's fields array
					scope.stemLayout.fields.splice(ui.item.startIndex - 1, 1);
					scope.stemLayout.fields.splice(ui.item.index() - 1, 0 , field);
				}
			});
		}
	}
});

Stem.directive('stemFieldEditor', [function() {
	return {
		restrict : 'A',
		scope : {
			stemField : '=stemFieldEditor'
		},
		templateUrl: "stem-field-editor.html",
	}
}]);

Stem.directive('stemScalar', function() {
	return {
		restrict: 'A',
		scope: {
			stemScalar: '='
		},
		templateUrl: "stem-scalar.html"
	}
});

Stem.directive('stemTable', function(stemTable, $compile) {
	return {
		restrict: 'A',
		scope: {
			stemTable: '='
		},
		templateUrl: "stem-table.html",
		link: function(scope, element, attributes) {
	        scope.$watch(function () { return element[0].childNodes[0].childNodes[3]; }, function(newValue, oldValue) {
				new stemTable.Table("#" + scope.stemTable.id + "-table", scope.stemTable.columns, scope.stemTable.value);
			});
		}
	}
});

Stem.directive('stemTextArea', function() {
	return {
		restrict: 'A',
		scope: {
			stemTextArea: '='
		},
		templateUrl: "stem-text-area.html",
		link: function(scope, element, attributes) {
			// Watching for the node to be created
			scope.$watch(function () { return element[0].childNodes[1].childNodes[5]; }, function(newValue, oldValue) {
				// Overflow event handler
				newValue.addEventListener('overflow', function(ev) {
					 if (ev.type == "overflow") {
						 if (ev.detail == 0 || ev.detail == 2) {
							 $(newValue).innerHeight($(this).innerHeight() + 20);
						 }
					 }
				}, false);
			});			
		}
	}
});
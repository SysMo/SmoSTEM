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
			},
			$scope.removeLayout = function(layout) {
				var index = $scope.stemBoard.layouts.indexOf(layout);
				if (index >= 0) {
					scope.stemLayout.layouts.splice(index, 1);
				}
			}			
		},
		link: function (scope, element, attributes) {
			// Initialize droppable board
			$(scope.stemBoard.containerSelector).droppable({
				accept: scope.stemBoard.layoutsSelector,
				hoverClass: 'droppable-hover',
				drop: function( event, ui ) {
					var layoutClassId = ui.draggable.context.id; // id of li element; is the same as component type
					$('#'+layoutClassId).draggable("option", "revert", false);
					var layout;
					switch (layoutClassId) {
					case 'grid_Wide':
						//element.parent().append($compile('<div style="overflow: auto; margin-bottom: 10px;" stem-layout="null"></div>')(scope));
						layout = new stemClasses.Layout('grid', 'wide');
						scope.addLayout(layout);
						break;
					case 'grid_Narrow':
						layout = new stemClasses.Layout('grid', 'narrow');
						scope.addLayout(layout);
						//element.parent().append($compile('<div style="overflow: auto; margin-bottom: 10px;" stem-layout="null"></div>')(scope));
						break;
					}
					scope.$apply();
					$(scope.stemBoard.containerSelector).height($(scope.stemBoard.containerSelector).height() + 500);
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
				accept: scope.$parent.componentsSelector,
				hoverClass: 'droppable-hover',
				drop: function( event, ui ) {
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
					}
					scope.$apply();
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
		link: function(scope, element, attrs) {
			element.sortable({
				axis: "y",
				connectWith: "#" + scope.stemScalar.parent.id + ' div[stem-scalar], ' + "#" + scope.stemScalar.parent.id + ' div[stem-table]'
			});
			scope.del = function() {
				scope.stemScalar.del();
				scope.$parent.areaVariables.splice(scope.$parent.areaVariables.indexOf(scope.stemScalar), 1);
			}
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
				element.sortable({
					axis: "y",
					connectWith: "#" + scope.stemTable.parent.id + ' div[stem-scalar], ' + "#" + scope.stemTable.parent.id + ' div[stem-table]'
				});
			});
		}
	}
});

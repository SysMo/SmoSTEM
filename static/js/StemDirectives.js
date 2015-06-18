Stem.directive('stemModal', [function() {
	return {
		restrict : 'A',
		scope : {
			stemModel : '=model'
		},
		templateUrl: "stem-modal.html",
	}
}]);

Stem.directive('stemLayout', function($compile) {
	return {
		restrict : 'A',
		scope : {
			layoutsSelector: '@',
		},
		templateUrl: "stem-layout.html",
		link: function (scope, element, attributes) {
			// Initialize layouts library
			$(scope.layoutsSelector).each(function(index, element){
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
			
			$('#main').droppable({
				accept: scope.layoutsSelector,
				hoverClass: 'droppable-hover',
				drop: function( event, ui ) {
					var layoutClassId = ui.draggable.context.id; // id of li element; is the same as component type
					$('#'+layoutClassId).draggable("option", "revert", false);
					var layout;
					switch (layoutClassId) {
					case 'columns_Layout':
						element.parent().append($compile('<div style="overflow: auto; margin-bottom: 10px;" layout="columns" stem-board="eVars" components-selector ="#ModelComponentsToolbar > ul > li">')(scope));
						break;
					case 'canvas_Layout':
						element.parent().append($compile('<div style="overflow: auto; margin-bottom: 10px;" layout="canvas" stem-board="eVars" components-selector ="#ModelComponentsToolbar > ul > li">')(scope));
						break;
					}
					$('#main').height($('#main').height() + 500);
				}
			});
		}
	}
});

Stem.directive('stemBoard', function(stemClasses) {
	return {
		restrict: 'A',
		scope: {
			stemBoard: '=',
			componentsSelector: '@',
			layout: '@'
		},
		templateUrl: "stem-board.html",
		link: function (scope, element, attributes) {
			scope.stemBoard = scope.stemBoard || new stemClasses.VariableContainer();
			// Initialize component library
			$(scope.componentsSelector).each(function(index, element){
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


Stem.directive('stemBoardDroppableArea', function(stemClasses) {
	return {
		restrict : 'A',
		scope: {
			stemBoard: '=board',
			componentsSelector: '@',
		},
		templateUrl: "stem-board-droppable-area.html",
		link: function(scope, element, attributes) {
			scope.areaVariables = [];
			element.parent().droppable({
				accept: scope.componentsSelector,
				hoverClass: 'droppable-hover',
				drop: function( event, ui ) {
					var componentClassId = ui.draggable.context.id; // id of li element; is the same as component type
					$('#'+componentClassId).draggable("option", "revert", false);
					var component;
					switch (componentClassId) {
					case 'components_Variable':
						component = new stemClasses.ScalarVariable(); 
						scope.stemBoard.addVariable(component);
						scope.areaVariables.push(component);
						break;
					case 'components_Table':
						//component = scope.stemBoard.createTableVariable();
						component = new stemClasses.TableVariable();
						scope.stemBoard.addVariable(component);
						scope.areaVariables.push(component);
						break;
					}
					scope.$apply();
				}
			});
		}
	}
});

Stem.directive('stemScalarEditor', [function() {
	return {
		restrict : 'A',
		scope : {
			stemScalar : '=stemScalarEditor'
		},
		templateUrl: "stem-scalar-editor.html",
	}
}]);

Stem.directive('stemScalar', [function() {
	return {
		restrict: 'A',
		scope: {
			stemScalar: '='
		},
		templateUrl: "stem-scalar.html",
	}
}]);

Stem.directive('stemTable', function(stemTable, $compile) {
	return {
		restrict: 'A',
		scope: {
			stemTable: '='
		},
		//templateUrl: "stem-table.html",
		controller: function($scope) {
			
		},
		link: function(scope, element, attributes) {
			var template = '\
				<div id="{{stemTable.id}}" style="width: 450px; background: #EEE; margin: 5px; padding: 5px; border: solid 1px #AAA">\
				  <div>{{stemTable.name}} : {{stemTable.description}}</div>\
				  <table id="{{stemTable.id}}-table"></table>\
				</div>';
			
			var el = angular.element(template);
	        compiled = $compile(el);
	        element.append(el);
	        compiled(scope);
	        scope.$watch(function () { return element[0].childNodes[0].childNodes[3]; }, function(newValue, oldValue) {
				new stemTable.Table("#" + scope.stemTable.id + "-table", scope.stemTable.columns, scope.stemTable.data);
			});
		}
	}
});
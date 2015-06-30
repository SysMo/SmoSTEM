Stem.directive('stemModal', [function() {
	return {
		restrict : 'A',
		scope : {
			stemModel : '=model'
		},
		templateUrl: "stem-modal.html",
	}
}]);

Stem.directive('stemBoard', function(stemClasses, $timeout) {
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
					$scope.stemBoard.layouts.splice(index, 1);
				}
			}			
		},
		link: function (scope, element, attributes) {
			$(scope.stemBoard.containerSelector).css('min-height', '520');
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
					case 'formulas':
						field = new stemClasses.FormulasField();
						layout = new stemClasses.Layout('formulas');
						layout.fields.push(field);
						scope.addLayout(layout);
						break;
					}
					$timeout(function(){
						scope.$apply();
					});
				}
			});
			
			// Initialize set of draggable layouts
			$(scope.stemBoard.layoutsSelector).each(function(index, element){
				$(element)
				.draggable({
					appendTo: "body",
					scroll: false,
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
					scroll: false,
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

Stem.directive('stemGridLayout', function(stemClasses, $timeout) {
	return {
		restrict : 'A',
		scope: {
			stemLayout: '=stemGridLayout',
		},
		templateUrl: "stem-grid-layout.html",
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
				element.css('width', '520px');
			} else {
				element.css('width', '1060px');
			}
			if (scope.stemLayout.height) {
				element.css('height', scope.stemLayout.height);
			} else {
				element.css('height', '500px');
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
					$timeout(function(){
						scope.$apply();
					});
				}
			});
			element.resizable({
				handles: "s",
				resize: function(event, ui) {
					scope.stemLayout.height = ui.size.height + 'px';
				}
			});
			element.find('.sortables_div').sortable({
				containment: "#" + scope.stemLayout.id + ' > .sortables_div',
				axis: "y",
				start: function(event, ui) {
					ui.item.startIndex = ui.item.index();
				},
				stop : function(event, ui) {
					// field being moved among sortables
					var field = scope.stemLayout.fields[ui.item.startIndex];
					// modifying the layout's fields array
					scope.stemLayout.fields.splice(ui.item.startIndex, 1);
					scope.stemLayout.fields.splice(ui.item.index(), 0 , field);
					
					$timeout(function(){
						scope.$apply();
						console.log(scope.stemLayout.fields);
					});
				}
			});
		}
	}
});


Stem.directive('stemFormulasLayout', function(stemClasses, $timeout) {
	return {
		restrict : 'A',
		scope: {
			stemLayout: '=stemFormulasLayout',
		},
		templateUrl: "stem-formulas-layout.html",
		replace: true,
		link: function(scope, element, attributes) {
			if (scope.stemLayout.height) {
				element.css('height', scope.stemLayout.height);
			} else {
				element.css('height', '500px');
			}
			scope.$watch(function() { return element[0].childNodes[3]; }, function(newValue, oldValue) {
				// Ace code editor
				scope.editor = ace.edit(scope.stemLayout.id + '-aceEditor');
				scope.editor.getSession().setMode("ace/mode/python");
				scope.editor.setFontSize(14);
				scope.editor.setValue(scope.stemLayout.fields[0].value);
				scope.editor.clearSelection();
				scope.editor.on('change', function (ev) {
					scope.stemLayout.fields[0].value = scope.editor.getValue();
				});
				element.resizable({
					handles: "s",
					resize: function(event, ui) {
						scope.stemLayout.height = ui.size.height + 'px';
				        scope.editor.resize();
				    }
				});
			});
		}
	}
});


Stem.directive('stemScalar', function() {
	return {
		restrict: 'A',
		scope: {
			stemScalar: '='
		},
		controller: function($scope, StemQuantities, stemUtil) {
			// Ensure that the scalar has a quantity and unit
			$scope.stemScalar.quantity = $scope.stemScalar.quantity || 'Dimensionless';
			$scope.stemScalar.displayUnit = $scope.stemScalar.displayUnit || '-';
			
			$scope.quantities = StemQuantities.quantities;
			$scope.unitOptions = $scope.quantities[$scope.stemScalar.quantity].units;
			$scope.edit = function() {
				$( '#' + $scope.stemScalar.id +'-modal').modal( "show" );
			};
			$scope.onInputValueChange = function() {
				$scope.stemScalar.value = StemQuantities.toSIUnit(
					$scope.stemScalar.quantity, $scope.stemScalar.displayUnit, parseFloat($scope.displayValue)
				);
			};
			$scope.onUnitChange = function() {
				$scope.displayValue = stemUtil.formatNumber(StemQuantities.fromSIUnit(
					$scope.stemScalar.quantity, $scope.stemScalar.displayUnit, $scope.stemScalar.value
				));
			};
			$scope.onUnitChange();
		},
		templateUrl: "stem-scalar.html"
	}
});

Stem.directive('stemScalarEditor', [function() {
	return {
		restrict : 'A',
		controller: function($scope) {
			$scope.setDisplayUnit = function() {
				$scope.unitOptions = $scope.quantities[$scope.stemScalar.quantity].units;
				$scope.stemScalar.displayUnit = $scope.unitOptions[0][0];
			};
		},
		link: function(scope, element, attributes) {
			element.find('input').first().on('input', function(event) {
				if (!this.checkValidity()) {
					$('#' + scope.stemScalar.id + '-OkButton').prop('disabled', true);
					$(this).next().css('color', 'red').html('Name is required and must be a valid Python identifier.');
				} else {
					$('#' + scope.stemScalar.id + '-OkButton').prop('disabled', false);
					$(this).next().html('');
				}
			});
		},
		templateUrl: "stem-scalar-editor.html",
	}
}]);

Stem.directive('stemTable', function(stemTable, $compile) {
	return {
		restrict: 'A',
		scope: {
			stemTable: '='
		},
		controller: function($scope) {
			$scope.edit = function() {
				$( '#' + $scope.stemTable.id +'-modal').modal( "show" );
			};
		},
		templateUrl: "stem-table.html",
		link: function(scope, element, attributes) {
			if (scope.$parent.stemLayout.width == 'narrow') {
				element.css('width', '450px');
			} else {
				element.css('width', '98%');
			}
	        scope.$watch(function () { return element[0].childNodes[1].childNodes[5].childNodes[1]; }, function(newValue, oldValue) {
				new stemTable.Table("#" + scope.stemTable.id + "-table", scope.stemTable.columns, scope.stemTable.value);
			});
		}
	}
});

Stem.directive('stemTableEditor', [function() {
	return {
		restrict : 'A',
		link: function(scope, element, attributes) {
			element.find('input').first().on('input', function(event) {
				if (!this.checkValidity()) {
					$('#' + scope.stemTable.id + '-OkButton').prop('disabled', true);
					$(this).next().css('color', 'red').html('Name is required and must be a valid Python identifier.');
				} else {
					$('#' + scope.stemTable.id + '-OkButton').prop('disabled', false);
					$(this).next().html('');
				}
			});
		},
		templateUrl: "stem-table-editor.html",
	}
}]);

Stem.directive('stemTextArea', function() {
	return {
		restrict: 'A',
		scope: {
			stemTextArea: '='
		},
		controller: function($scope) {
			$scope.edit = function() {
				$( '#' + $scope.stemTextArea.id +'-modal').modal( "show" );
			};
		},
		templateUrl: "stem-text-area.html",
		link: function(scope, element, attributes) {
			if (scope.$parent.stemLayout.width == 'narrow') {
				element.css('width', '450px');
			} else if (scope.$parent.stemLayout.width == 'wide') {
				element.css('width', '98%');
			}
			element.find('textarea').css('width', '98%').css('max-width', '98%');
			// Watching for the node to be created
			scope.$watch(function () { return element[0].childNodes[1].childNodes[5]; }, function(newValue, oldValue) {
				newValue.addEventListener('input', function(ev) {
					if (this.scrollHeight > this.clientHeight) {
						$(this).height(this.clientHeight + 20);
					}
				});
			});			
		}
	}
});

Stem.directive('stemTextAreaEditor', [function() {
	return {
		link: function(scope, element, attributes) {
			element.find('input').first().on('input', function(event) {
				if (!this.checkValidity()) {
					$('#' + scope.stemTextArea.id + '-OkButton').prop('disabled', true);
					$(this).next().css('color', 'red').html('Name is required and must be a valid Python identifier.');
				} else {
					$('#' + scope.stemTextArea.id + '-OkButton').prop('disabled', false);
					$(this).next().html('');
				}
			});
		},
		templateUrl: "stem-text-area-editor.html",
	}
}]);
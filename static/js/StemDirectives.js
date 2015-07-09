Stem.directive('stemModal', function($timeout) {
	return {
		restrict : 'A',
		scope : {
			stemModel : '=model'
		},
		controller: function($scope) {
			$scope.setImage = function() {
				if ($scope.stemModel.background !== undefined) {
					$("body").css("background-image", "url('" + $scope.stemModel.background + "')");
				}
			}
			$scope.setImage();
		},
		link: function(scope, element, attrs) {
			scope.$watch(function() {return scope.stemModel.$resolved;}, function(newValue, oldValue){
				scope.setImage();
			});
		},
		templateUrl: "stem-modal.html",
	}
});

Stem.directive('stemBoard', function(stemClasses, $timeout) {
	return {
		restrict: 'A',
		scope: {
			stemBoard: '=',
			containerSelector: '@',
			layoutsSelector: '@',
			componentsSelector: '@'
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
			$(scope.containerSelector).css('min-height', '520');
			// Initialize droppable board
			$(scope.containerSelector).droppable({
				accept: scope.layoutsSelector,
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
					case 'free':
						layout = new stemClasses.Layout('free');
						scope.addLayout(layout);
						break;
					}
					$timeout(function(){
						scope.$apply();
					});
				}
			});
			
			// Initialize set of draggable layouts
			$(scope.layoutsSelector).each(function(index, element){
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
			$(scope.componentsSelector).each(function(index, element){
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
						
					}
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
			$scope.edit = function() {
				$( '#' + $scope.stemLayout.id +'-modal').modal( "show" );
			};
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
				accept: scope.$parent.componentsSelector,
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
					case 'fields_Formulas':
						field = new stemClasses.FormulasField();
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
				handle: ".drag-handle",
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
					});
				}
			});
		}
	}
});

Stem.directive('stemFreeLayout', function(stemClasses, $timeout) {
	return {
		restrict : 'A',
		scope: {
			stemLayout: '=stemFreeLayout',
		},
		templateUrl: "stem-free-layout.html",
		replace: true,
		controller: function($scope) {
			$scope.edit = function() {
				$( '#' + $scope.stemLayout.id +'-modal').modal( "show" );
			};
			$scope.addField = function(field) {
				$scope.stemLayout.fields.push(field);
			};
			$scope.removeField = function(field) {
				var index = $scope.stemLayout.fields.indexOf(field);
				if (index >= 0) {
					$scope.stemLayout.fields.splice(index, 1);
				}
			};
			$scope.findField = function(id){
				for (var i=0; i<$scope.stemLayout.fields.length; i++) {
					if (id == $scope.stemLayout.fields[i].id) {
						return $scope.stemLayout.fields[i];
					}
				}
				return null;
			};
		},
		link: function(scope, element, attributes) {
			if (scope.stemLayout.height) {
				element.css('height', scope.stemLayout.height);
			} else {
				element.css('height', '500px');
			}
			element.droppable({
				accept: scope.$parent.componentsSelector + '#fields_Scalar, ' +
						scope.$parent.componentsSelector + '#fields_TextArea, ' +
						'#' + scope.stemLayout.id + ' [stem-scalar], #' +
						scope.stemLayout.id + ' [stem-text-area]',
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
					case 'fields_TextArea':
						field = new stemClasses.TextField();
						scope.addField(field);
						break;
					}
					if (field === undefined) {
						var id = ui.draggable.children().first().attr('id');
						field = scope.findField(id);
					}
					field.left = ui.offset.left - $(this).offset().left;
					field.top = ui.offset.top - $(this).offset().top;
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
		}
	}
});

Stem.directive('stemLayoutEditor', [function() {
	return {
		restrict : 'A',
		scope: {
			stemLayout: "=stemLayoutEditor"
		},
		controller: function($scope) {
			$scope.setImage = function() {
				if ($scope.stemLayout.image !== undefined) {
					$("#" + $scope.stemLayout.id).css("background", "url('" + $scope.stemLayout.image + "')");
				}
			}
		},
		link: function(scope, element, attrs) {
			scope.$watch(function() {return element[0];}, function(newValue, oldValue){
				scope.setImage();
			});
		},
		templateUrl: "stem-layout-editor.html",
	}
}]);


Stem.directive('stemScalar', function() {
	return {
		restrict: 'A',
		scope: {
			stemScalar: '=',
			layout: '=',
			layoutId: '='
		},
		controller: function($scope, StemQuantities, StemUtil) {
			$scope.edit = function() {
				$( '#' + $scope.stemScalar.id +'-modal').modal( "show" );
			};
			$scope.stemScalar.quantities = StemQuantities.quantities;
			$scope.stemScalar.unitOptions = $scope.stemScalar.quantities[$scope.stemScalar.quantity].units;
			// Ensure that the scalar has a quantity and unit
			$scope.stemScalar.quantity = $scope.stemScalar.quantity || 'Dimensionless';
			$scope.stemScalar.displayUnit = $scope.stemScalar.displayUnit || '-';
			$scope.onInputValueChange = function() {
				var numValue = parseFloat($scope.displayValue);
				if (!isNaN(numValue)) {
					$scope.stemScalar.value = StemQuantities.toSIUnit(
						$scope.stemScalar.quantity, $scope.stemScalar.displayUnit, numValue
					);
				}
			};
			$scope.onUnitChange = function() {
				$scope.displayValue = StemUtil.formatNumber(StemQuantities.fromSIUnit(
					$scope.stemScalar.quantity, $scope.stemScalar.displayUnit, $scope.stemScalar.value
				));
			};
			$scope.onUnitChange();
		}, 
		link: function(scope, element, attrs) {
			element.css("width", "450px");
			if (scope.layout == 'free') {
				element.css({'position': 'absolute', 'left': scope.stemScalar.left, 'top': scope.stemScalar.top});
				if (scope.stemScalar.angle === undefined) {
					scope.stemScalar.angle = 0;
				}
				scope.$watch(function () { return element[0].childNodes[1]}, function(newValue, oldValue) {
					element.draggable({
						handle: ".drag-handle",
					});
					element.children().first().css('transform', 'rotate(' + String(scope.stemScalar.angle) + 'deg)');
					scope.rotate = function() {
						scope.stemScalar.angle += 45;
						element.children().first().css('transform', 'rotate(' + String(scope.stemScalar.angle) + 'deg)');
					}
				});
			}
		},
		templateUrl: "stem-scalar.html"
	}
});

Stem.directive('stemScalarEditor', [function() {
	return {
		restrict : 'A',
		scope: {
			stemScalar: "=stemScalarEditor"
		},
		controller: function($scope) {
			$scope.setDisplayUnit = function() {
				$scope.stemScalar.unitOptions = $scope.stemScalar.quantities[$scope.stemScalar.quantity].units;
				$scope.stemScalar.displayUnit = $scope.stemScalar.quantities[$scope.stemScalar.quantity].SIUnit;
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

Stem.directive('stemTable', function(StemTable, StemQuantities, StemUtil, $compile) {
	return {
		restrict: 'A',
		scope: {
			stemTable: '='
		},
		controller: function($scope) {
			$scope.quantities = StemQuantities.quantities;
			// Ensure that the tabale columns have a quantity and unit
			for (var i=0; i<$scope.stemTable.columns.length; i++) {
				$scope.stemTable.columns[i].quantity = $scope.stemTable.columns[i].quantity || 'Dimensionless';
				$scope.stemTable.columns[i].displayUnit = $scope.stemTable.columns[i].displayUnit || '-';
				$scope.stemTable.columns[i].unitOptions = $scope.quantities[$scope.stemTable.columns[i].quantity].units;
			}
			
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
				scope.tableDOMobject = new StemTable.Table("#" + scope.stemTable.id + "-table", scope.stemTable.columns, scope.stemTable.value);
				scope.onUnitChange = function() {
					scope.tableDOMobject.columns[scope.activeColumnIndex] = scope.activeColumn;
					angular.forEach(scope.tableDOMobject.data, function(row, rowIndex) {
						row[scope.activeColumnIndex] = 
							StemUtil.formatNumber(StemQuantities.fromSIUnit
										(
											scope.activeColumn.quantity, scope.activeColumn.displayUnit, 
											scope.stemTable.value[rowIndex][scope.activeColumnIndex]
										)
							);
					});
				};
				scope.updateValue = function() {
					scope.activeColumnIndex = scope.tableDOMobject.activeColumnIndex;
					scope.activeColumn = scope.stemTable.columns[scope.activeColumnIndex];
					angular.forEach(scope.stemTable.value, function(row, rowIndex) {
						row[scope.activeColumnIndex] = 
							StemQuantities.toSIUnit(
								scope.activeColumn.quantity, scope.activeColumn.displayUnit, 
								parseFloat(scope.tableDOMobject.data[rowIndex][scope.activeColumnIndex])
							);
					});
				};
				for (var i=0; i<scope.stemTable.columns.length; i++) {
					scope.activeColumnIndex = i;
					scope.activeColumn = scope.stemTable.columns[i];
					scope.onUnitChange();
				}
			});
		}
	}
});

Stem.directive('stemTableEditor', [function() {
	return {
		restrict : 'A',
		scope: {
			stemTable: '=stemTableEditor'
		},
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

Stem.directive('stemTableColumnEditor', function($timeout, StemQuantities, StemUtil) {
	return {
		restrict : 'A',
		controller: function($scope) {
			$scope.setDisplayUnit = function() {
				$scope.activeColumn.unitOptions = $scope.quantities[$scope.activeColumn.quantity].units;
				$scope.activeColumn.displayUnit = $scope.quantities[$scope.activeColumn.quantity].SIUnit;
			};
		},
		link: function(scope, element, attributes) {
			element.find('input').first().on('input', function(event) {
				if (!this.checkValidity()) {
					$('#' + scope.stemTable.id + '-columnModal-OkButton').prop('disabled', true);
					$(this).next().css('color', 'red').html('Name is required and must be a valid Python identifier.');
				} else {
					$('#' + scope.stemTable.id + '-columnModal-OkButton').prop('disabled', false);
					$(this).next().html('');
				}
			});
			
			element.find('.modal').on('show.bs.modal', function (e) {
				scope.updateValue();
				$timeout(function() {
					scope.$apply();
				});
			});
			
			element.find('button').eq(1).on('click', function (e) {
				scope.onUnitChange();
				scope.tableDOMobject.renderTable();
				scope.tableDOMobject.updateView();
			});
			
		},
		templateUrl: "stem-table-column-editor.html",
	}
});

Stem.directive('stemTextArea', function() {
	return {
		restrict: 'A',
		scope: {
			stemTextArea: '=',
			layout: '=',
			layoutId: '='
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
			} else if (scope.$parent.stemLayout.width == 'wide' && scope.$parent.stemLayout.type == 'grid') {
				element.css('width', '98%');
			} else if (scope.$parent.stemLayout.type == 'free') {
				element.css('width', '200px');
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
			if (scope.layout == 'free') {
				element.css({'position': 'absolute', 'left': scope.stemTextArea.left, 'top': scope.stemTextArea.top});
				if (scope.stemTextArea.angle === undefined) {
					scope.stemTextArea.angle = 0;
				}
				scope.$watch(function () { return element[0].childNodes[1]}, function(newValue, oldValue) {
					element.draggable({
						handle: ".drag-handle",
					});
					element.children().first().css('transform', 'rotate(' + String(scope.stemTextArea.angle) + 'deg)');
					scope.rotate = function() {
						scope.stemTextArea.angle += 45;
						element.children().first().css('transform', 'rotate(' + String(scope.stemTextArea.angle) + 'deg)');
					}
				});
			}
		}
	}
});

Stem.directive('stemTextAreaEditor', [function() {
	return {
		scope: {
			stemTextArea: "=stemTextAreaEditor"
		},
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

Stem.directive('stemFormulas', function() {
	return {
		restrict: 'A',
		scope: {
			stemFormulas: '='
		},
		controller: function($scope) {
			$scope.edit = function() {
				$( '#' + $scope.stemFormulas.id +'-modal').modal( "show" );
			};
		},
		templateUrl: "stem-formulas.html",
		link: function(scope, element, attributes) {
			element.css("width", "450px");
			// Watching for the node to be created
			scope.$watch(function() { return element[0].childNodes[1].childNodes[5]; }, function(newValue, oldValue) {
				$(element[0].childNodes[1]).height(scope.stemFormulas.height);
				// Ace code editor
				scope.editor = ace.edit(scope.stemFormulas.id + '-aceEditor');
				scope.editor.getSession().setMode("ace/mode/python");
				scope.editor.setFontSize(16);
				scope.editor.setValue(scope.stemFormulas.value);
				scope.editor.clearSelection();
				scope.editor.on('change', function (ev) {
					scope.stemFormulas.value = scope.editor.getValue();
				});
				$(element[0].childNodes[1]).resizable({
					handles: "s",
					resize: function(event, ui) {
						scope.stemFormulas.height = ui.size.height + 'px';
				        scope.editor.resize();
				    }
				});
			});
		}
	}
});

Stem.directive('stemFormulasEditor', [function() {
	return {
		scope: {
			stemFormulas: "=stemFormulasEditor"
		},
		link: function(scope, element, attributes) {
			element.find('input').first().on('input', function(event) {
				if (!this.checkValidity()) {
					$('#' + scope.stemFormulas.id + '-OkButton').prop('disabled', true);
					$(this).next().css('color', 'red').html('Name is required and must be a valid Python identifier.');
				} else {
					$('#' + scope.stemFormulas.id + '-OkButton').prop('disabled', false);
					$(this).next().html('');
				}
			});
		},
		templateUrl: "stem-formulas-editor.html",
	}
}]);

Stem.directive('stemListItemActions', [function() {
	return {
		scope: {
			add: "&add",
			del: "&del",
			edit: "&edit",
		},
		templateUrl: "stem-list-item-actions",
		link: function(scope, element, attributes) {
			if (!("add" in attributes)) {
				scope.add = false;
			}
			if (!("del" in attributes)) {
				scope.del = false;
			}
			if (!("edit" in attributes)) {
				scope.edit = false;
			}
		}
	}
}]);

Stem.directive('tooltip', function(){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            var mouseIn;
        	$(element).hover(function(){
                // on mouseenter
        		mouseIn = true;
                $(element).tooltip('show');
            }, function(){
                // on mouseleave
            	mouseIn = false;
                $(element).tooltip('hide');
            });
            $(element).keyup(function(){
            	if (mouseIn) {
            		$(element).tooltip('show');
            	}
            });
        }
    };
});
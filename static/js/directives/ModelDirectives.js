Stem.directive('stemDraggable', function() {
    return {
    	restrict : 'A',
		scope : {
			stemDraggable: '@'
		},
		link: function(scope, element, attributes) {
			var el = element[0];
	        el.draggable = true;
	        el.addEventListener(
	            'dragstart',
	            function(e) {
	                e.dataTransfer.effectAllowed = 'move';
	                e.dataTransfer.setData('Text', scope.stemDraggable);
	                this.classList.add('drag');
	                return false;
	            },
	            false
	        );

	        el.addEventListener(
	            'dragend',
	            function(e) {
	                this.classList.remove('drag');
	                return false;
	            },
	            false
	        );	
		}
    }
});


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
			element.find('input').on('keyup', function(event) {
				if (event.which == 13) {
					$('#' + scope.stemModel._id +'-modal').modal("hide");
				}
			});
			element.on('shown.bs.modal', function () {
				$(this).find('input').first().focus().select();
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
		controller: function($scope, StemUtil) {
			$scope.addLayout = function(layout) {
				$scope.stemBoard.layouts.push(layout);
			},
			$scope.removeLayout = function(layout) {
				var index = $scope.stemBoard.layouts.indexOf(layout);
				if (index >= 0) {
					$scope.stemBoard.layouts.splice(index, 1);
				}
			},
			$scope.duplicateLayout = function(layout) {
				var copy = angular.copy(layout);
				copy.title = "Copy_of_" + layout.title;
				copy.id = StemUtil.guid();
				angular.forEach(copy.fields, function(value, index) {
					value.id = StemUtil.guid();
				});
				var index = $scope.stemBoard.layouts.indexOf(layout);
				if (index >= 0) {
					$scope.stemBoard.layouts.splice(index + 1, 0, copy);
				}
			}
			$scope.moveDown = function(layout) {
				var index = $scope.stemBoard.layouts.indexOf(layout);
				if (index >= 0) {
					$scope.stemBoard.layouts.splice(index, 1);
					$scope.stemBoard.layouts.splice(index + 1, 0, layout);
				}
			}
			$scope.moveUp = function(layout) {
				var index = $scope.stemBoard.layouts.indexOf(layout);
				if (index > 0) {
					$scope.stemBoard.layouts.splice(index, 1);
					$scope.stemBoard.layouts.splice(index - 1, 0, layout);
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
			$scope.resize = function() {
				var el = $('#' + $scope.stemLayout.id);
				if (el[0].scrollHeight > el[0].clientHeight) {
					el.height(el[0].scrollHeight);
					$scope.stemLayout.height = el.height();
				}
			}
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
			// Determine dynamic style features
			$scope.dynamicStyle = {border: ''};
			$scope.$watch('stemLayout.hasScope', function (newValue, oldValue) {
				if ($scope.stemLayout.hasScope) {
					$scope.dynamicStyle.border = '2px solid #606060';
				} else {
					$scope.dynamicStyle.border = 'none';					
				}
			});
			
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

Stem.directive('stemLayoutProperties', [function() {
	return {
		restrict : 'A',
		scope: {
			stemLayout: "=stemLayoutProperties"
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
			element.find('input').on('keyup', function(event) {
				if (event.which == 13) {
					$('#' + scope.stemLayout.id +'-modal').modal("hide");
				}
			});
			element.on('shown.bs.modal', function () {
				$(this).find('input').first().focus().select();
			});
		},
		templateUrl: "stem-layout-properties.html",
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
			$scope.quantities = StemQuantities.quantities;
			var quantityName = $scope.stemScalar.quantity;
			if (!(quantityName && quantityName in $scope.quantities)) {
				$scope.stemScalar.quantity = 'Dimensionless';
			}
			$scope.unitOptions = $scope.quantities[$scope.stemScalar.quantity].units;
			var displayUnit = $scope.stemScalar.displayUnit;
			if (!(displayUnit && $scope.unitOptions.filter(function(el) {return el[0] == displayUnit}).length > 0 )) {
				$scope.stemScalar.displayUnit = $scope.quantities[$scope.stemScalar.quantity].SIUnit;
			}
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

Stem.directive('stemScalarProperties', function() {
	return {
		restrict: 'A',
		controller: function($scope, StemQuantities) {
			$scope.setDisplayUnit = function() {
				$scope.unitOptions = $scope.quantities[$scope.stemScalar.quantity].units;
				$scope.stemScalar.displayUnit = $scope.quantities[$scope.stemScalar.quantity].SIUnit;
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
			element.find('input').on('keyup', function(event) {
				if (event.which == 13) {
					$('#' + scope.stemScalar.id +'-modal').modal("hide");
				}
			});
			element.on('shown.bs.modal', function () {
				$(this).find('input').first().focus().select();
			});
		},
		templateUrl: "stem-scalar-properties.html",
	}
});

Stem.directive('stemTable', function(StemHOT, StemQuantities, StemUtil, $compile) {
	return {
		restrict: 'A',
		scope: {
			stemTable: '='
		},
		controller: function($scope) {
			$scope.quantities = StemQuantities.quantities;
			$scope.columns = angular.copy($scope.stemTable.columns);
			// Ensure that the tabale columns have a quantity and unit
			for (var i=0; i<$scope.stemTable.columns.length; i++) {
				var quantityName = $scope.stemTable.columns[i].quantity;
				if (!(quantityName && quantityName in $scope.quantities)) {
					$scope.stemTable.columns[i].quantity = 'Dimensionless';
					$scope.columns.quantity = 'Dimensionless';
				}
				var unitOptions = $scope.quantities[$scope.stemTable.columns[i].quantity].units;
				$scope.columns[i].unitOptions = angular.copy(unitOptions);
				var displayUnit = $scope.stemTable.columns[i].displayUnit;
				if (!(displayUnit && unitOptions.filter(function(el) {return el[0] == displayUnit}).length > 0 )) {
					$scope.stemTable.columns[i].displayUnit = $scope.quantities[$scope.stemTable.columns[i].quantity].SIUnit;
					$scope.columns[i].displayUnit = $scope.quantities[$scope.stemTable.columns[i].quantity].SIUnit;
				}
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
	        scope.$watch(function () { return element[0].childNodes[1].childNodes[5]; }, function(newValue, oldValue) {
	        	scope.HOTobj = new StemHOT.Table("#" + scope.stemTable.id + "-table", scope.stemTable, scope);
			});
		}
	}
});

Stem.directive('stemTableProperties', [function() {
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
			element.find('input').on('keyup', function(event) {
				if (event.which == 13) {
					$('#' + scope.stemTable.id +'-modal').modal("hide");
				}
			});
			element.on('shown.bs.modal', function () {
				$(this).find('input').first().focus().select();
			});
		},
		templateUrl: "stem-table-properties.html",
	}
}]);

Stem.directive('stemTableColumnProperties', function($timeout, StemQuantities, StemUtil) {
	return {
		restrict : 'A',
		controller: function($scope) {
			$scope.reset = function() {
				$scope.propertiesPristine = true;
				$scope.quantityPristine = true;
			}
			$scope.reset();
			$scope.onPropChange = function() {
				$scope.propertiesPristine = false;
			};
			$scope.onQuantityChange = function() {
				$scope.quantityPristine = false;
				$scope.activeColumn.displayUnit = $scope.quantities[$scope.activeColumn.quantity].SIUnit;
			};
			$scope.applyChanges = function() {
				if ($scope.propertiesPristine == false) {
					$scope.HOTobj.onColPropChange();
				}
				if ($scope.quantityPristine == false) {
					$scope.HOTobj.onUnitChange($scope.activeColumnIndex);
				}
				$scope.reset();
			}
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
				scope.activeColumnIndex = scope.HOTobj.activeColumnIndex;
				scope.activeColumn = scope.stemTable.columns[scope.activeColumnIndex];
				$timeout(function() {
					scope.$apply();
				});
			});
		},
		templateUrl: "stem-table-column-properties.html",
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
				$('#' + $scope.stemTextArea.id +'-modal').modal( "show" );
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
				$( '#' + scope.stemTextArea.id +'-textarea').markdown({resize: 'both', fullscreen: {enable: false}});
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

Stem.directive('stemTextAreaProperties', [function() {
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
			element.find('input').on('keyup', function(event) {
				if (event.which == 13) {
					$('#' + scope.stemTextArea.id +'-modal').modal("hide");
				}
			});
			element.on('shown.bs.modal', function () {
				$(this).find('input').first().focus().select();
			});
		},
		templateUrl: "stem-text-area-properties.html",
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

Stem.directive('stemFormulasProperties', [function() {
	return {
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
			element.find('input').on('keyup', function(event) {
				if (event.which == 13) {
					$('#' + scope.stemFormulas.id +'-modal').modal("hide");
				}
			});
			element.on('shown.bs.modal', function () {
				$(this).find('input').first().focus().select();
			});
		},
		templateUrl: "stem-formulas-properties.html",
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

Stem.factory('StemHOT', ['StemQuantities', 'StemUtil', '$timeout',
                         function(StemQuantities, StemUtil, $timeout) {
	var StemHOT = {};
	
	StemHOT.Table = function(idSelector, angularTableObj, angularScope) {
		// Selector and corresponding node where the table is to be built
		this.idSelector = idSelector;
		this.node = $(idSelector)[0];
		this.columns = angularTableObj.columns;
		this.data = angularTableObj.value;
		this.scope = angularScope;
		var table = this;
		
		// Setting display data, i.e.the data used in the handsontable constructor
		this.displayData = [];
		$.each(table.data, function(rowIndex, row) {
			var displayRow = [];
			$.each(table.columns, function(colIndex, column) {
				displayRow.push(
					StemQuantities.fromSIUnit(
							column.quantity, column.displayUnit, 
							row[colIndex]
					)
				);
			});
			table.displayData.push(displayRow);
		});
		
		// Getting column widths
		this.colWidths = [];
		$.each(table.columns, function(colIndex, column) {
			if (column.width) {
				table.colWidths.push(column.width);
			} else {
				table.colWidths.push(150);
			}
		});
		
		// Initializing hot table
		this.hot = new Handsontable(this.node, {
			data: this.displayData,
		    contextMenu: true,
			colWidths: this.colWidths,
			// Custom function to determine column headers
		    colHeaders: function (col) {
		    	var txt = '<span style="margin-right: 5px;">' + table.columns[col].name + ' [' + table.columns[col].displayUnit + ']</span>';
		    	return txt;
		    },
		    manualColumnResize: true,
		    manualRowResize: true,
		    // Custom function to determine cell properties
		    cells: function (rowIndex, colIndex, prop) {
                var cellProperties = {};                
                cellProperties = {
                	type: 'numeric',
                    format: table.columns[colIndex].format || '0.00'
                };                
                return cellProperties;
            },
		});
		
		this.setContextMenu();
		
		this.setEvents();
		
		this.overrideInlineCss();
	};
	
	
	// Dynamically changing inline css properties
	StemHOT.Table.prototype.overrideInlineCss = function() {
		$(this.idSelector + ' .wtHolder').each(function(index, el){
			$(el).css('width', 'auto').css('height', 'auto').css('overflow-x', 'auto');
		});
		$(this.idSelector + ' .ht_clone_top').each(function(index, el){
			$(el).css('width', 'auto').css('height', 'auto').css('overflow-x', 'auto');
		});
		$(this.idSelector + ' .wtHider').each(function(index, el){
			$(el).css('width', 'auto').css('height', 'auto');
		});
	};
	
	// Setting custom events (some of the event handlers are simply used to override handsontable inline css
	// which appear on table manipulation)
	StemHOT.Table.prototype.setEvents = function() {
		var table = this;
		this.hot.updateSettings({
			beforeDrawBorders: function() {
				table.overrideInlineCss();
			},
			afterColumnResize: function(colIndex) {
				table.columns[colIndex].width = this.getColWidth(colIndex);
				table.overrideInlineCss();
			},
			afterScrollHorizontally: function() {
				table.overrideInlineCss();
			},
			afterContextMenuHide: function() {
				table.overrideInlineCss();
			},
 			afterChange: function(changes, source) {
		    	if (source != 'loadData') {
		    		// Updating the values in SI units after certain change events, e.g. cell input or copying of data 
		    		$.each(changes, function(index, change) {
		    			var rowIndex = change[0];
		    			var colIndex = change[1];
		    			var newValue = change[3];
			    		table.data[rowIndex][colIndex] = 
			    			StemQuantities.toSIUnit(
									table.columns[colIndex].quantity, table.columns[colIndex].displayUnit, 
									parseFloat(newValue)
							);
			    	});
		    	}
		    	table.overrideInlineCss();
		    },
			afterCreateCol: function(index, amount) {
				table.columns.splice(index, 0, {name: "c" + String(index+1), quantity: "Dimensionless", displayUnit: "-", unitOptions: ["-"]});
				table.colWidths.splice(index, 0, 150);
				
				for (var i=0; i<table.data.length; i++) {
					table.data[i].splice(index, 0, 0);
					table.displayData[i][index] = 0;
				}
			},
			afterCreateRow: function(index, amount) {
				var newRow = [];
				for (var i=0; i<table.columns.length; i++) {
					newRow.push(0);
				}
				table.data.splice(index, 0, newRow);
				$.each(table.displayData[index], function(i, el) {
					el = 0;
				});
			},
			afterRemoveCol: function(index, amount) {
				table.columns.splice(index, amount);
				for (var i=0; i<table.data.length; i++) {
					table.data[i].splice(index, amount);
				}
			},
			afterRemoveRow: function(index, amount) {
				table.data.splice(index, amount);
			},
			// Adding the dropdown menu to the column headers (adapted from the code at http://docs.handsontable.com/0.16.0/demo-custom-renderers.html#page-header)
			// The respective styles for the dropdown menus (also obtained from the example) are in StemHOT.css
			afterGetColHeader: function(col, TH) {
		        var instance = this,
		          menu,
		          button;
		        if (col > -1) {
		        	button = table.buildUnitMenuButton();
		        	menu = table.buildUnitMenu(StemQuantities.quantities[table.columns[col].quantity].units, table.columns[col].displayUnit);
		        	table.addUnitButtonMenuEvent(button, menu);	
			       
		        	Handsontable.Dom.addEvent(menu, 'click', function (event) {
			          if (event.target.nodeName == 'LI') {
			        	$(menu).find('li').each(function(index, el) {
			        		if ($(el).hasClass('active')) {
			        			$(el).removeClass('active');
			        		}
			        	});
			        	$(event.target).addClass('active');
			        	// Updating the displayUnit
			        	table.columns[col].displayUnit = event.target.data.unit;
			        	table.scope.stemTable.columns[col].displayUnit = event.target.data.unit;
			        	table.onUnitChange(col);
			          }
			          // Updating also the column header on displayUnit change
			          $(TH).find('.colHeader span').html(table.columns[col].name + ' [' + table.columns[col].displayUnit + ']');
			        });
			        if (TH.firstChild.lastChild.nodeName === 'BUTTON') {
			          TH.firstChild.removeChild(TH.firstChild.lastChild);
			        }
			        TH.firstChild.appendChild(button);
			        TH.style['white-space'] = 'normal';  
		        }
		    },
		});
	};
	
	// Builiding unit drop-down menu
	StemHOT.Table.prototype.buildUnitMenu = function (unitOptions, displayUnit) {
		var
        	menu = document.createElement('UL'),
        	options = [],
        	item, i, len;
        menu.className = 'unitMenu';
        for (i=0, len=unitOptions.length; i<len; i++) {
        	options.push(unitOptions[i][0]);
        }
        for (i=0, len=options.length; i<len; i++) {
        	item = document.createElement('LI');
        	if('innerText' in item) {
        		item.innerText = options[i];
        	} else {
        		item.textContent = options[i];
        	}
        	item.data = {'unit': options[i]};
        	if (options[i] == displayUnit) {
        		item.className = 'active';
        	}
        	menu.appendChild(item);
        }
        return menu;
	};
	
	
	// Bulding carret button
	StemHOT.Table.prototype.buildUnitMenuButton = function() {
        var button = document.createElement('BUTTON');
        button.innerHTML = '\u25BC';
        button.className = 'changeUnit';
        return button;
    };
	
	
	// Setting carret button click event
	StemHOT.Table.prototype.addUnitButtonMenuEvent = function(button, menu) {
		Handsontable.Dom.addEvent(button, 'click', function (event) {
          var unitMenu, position, removeMenu;
          document.body.appendChild(menu);
          event.preventDefault();
          event.stopImmediatePropagation();
          unitMenu = document.querySelectorAll('.unitMenu');
          for (var i=0, len=unitMenu.length; i<len; i++) {
            unitMenu[i].style.display = 'none';
          }
          menu.style.display = 'block';
          position = button.getBoundingClientRect();
          menu.style.top = (position.top + (window.scrollY || window.pageYOffset)) + 2 + 'px';
          menu.style.left = (position.left) + 'px';
          removeMenu = function (event) {
            if (event.target.nodeName == 'LI' && event.target.parentNode.className.indexOf('unitMenu') !== -1) {
              if (menu.parentNode) {
                menu.parentNode.removeChild(menu);
              }
            }
          };
          Handsontable.Dom.removeEvent(document, 'click', removeMenu);
          Handsontable.Dom.addEvent(document, 'click', removeMenu);
        });
    };
	
	// Setting customized context menu
	StemHOT.Table.prototype.setContextMenu = function() {
		var table = this;
		this.hot.updateSettings({
			contextMenu: {
				callback: function (key, options) {
					// custom option added to the default ones
				    if (key === 'edit_col') {
				    	// if no more than one column was selected
				    	if (options.start.col !== options.end.col) {
				    		return;
				    	}
				    	table.activeColumnIndex = options.start.col;
				    	setTimeout(function () {
				    		$(table.idSelector + "-columnModal").modal("show");
				    	}, 100);
				    }
				  },
				  items: {
				    "row_above": {},
					"row_below": {},
					"hsep1": "---------",
					"col_left": {}, 
					"col_right": {},
					"hsep2": "---------",
					"remove_row": {},
					"remove_col": {},
					"hsep3": "---------",
					"edit_col": {name: 'Edit column'}
				  }
			}
		});
	};
	
	// Method executed after name, format change
	StemHOT.Table.prototype.onColPropChange = function() {
		this.hot.render();
		this.overrideInlineCss();
	};
	
	// Method executed on unit change
	StemHOT.Table.prototype.onUnitChange = function(colIndex) {
		var table = this;
		$.each(table.data, function(rowIndex, row) {
			table.displayData[rowIndex][colIndex] = StemQuantities.fromSIUnit(
    				table.columns[colIndex].quantity, table.columns[colIndex].displayUnit, 
    				row[colIndex]);
		});
		this.hot.render();
		this.overrideInlineCss();
	};
	
	StemHOT.Table.prototype.resize = function (numRows, numCols) {
		var i;
		var table = this;
		var columnsLen = this.columns.length;
		var rowsLen = this.data.length;
		
		if (numCols < columnsLen) {
			this.columns.splice(numCols, columnsLen - numCols);
			this.colWidths.splice(numCols, columnsLen - numCols);
			
			for (i=0; i<table.data.length; i++) {
				table.data[i].splice(numCols, columnsLen - numCols);
				table.displayData[i].splice(numCols, columnsLen - numCols);
			}
		} else if (numCols > columnsLen) {
			for (var j=1; j <= numCols - columnsLen; j++) {
				table.columns.push({name: "c" + String(columnsLen + j), quantity: "Dimensionless", displayUnit: "-", unitOptions: ["-"]});
				this.colWidths.push(150);
				
				for (i=0; i<table.data.length; i++) {
					table.data[i].push(0);
					table.displayData[i].push(0);
				}

			}	
		}
		
		if (numRows < rowsLen) {
			this.data.splice(numRows, rowsLen - numRows);
			this.displayData.splice(numRows, rowsLen - numRows);
		} else if (numRows > rowsLen) {
			var newRow = [];
			for (i=0; i<table.columns.length; i++) {
				newRow.push(0);
			}
			
			for (i=1; i<= numRows - rowsLen; i++) {				
				this.data.push(angular.copy(newRow));
				this.displayData.push(angular.copy(newRow));
			}
		}
		
		this.hot.render();
		this.overrideInlineCss();
	};
	
	return StemHOT;
}]);
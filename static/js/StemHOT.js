Stem.factory('StemHOT', function(StemQuantities, StemUtil, $timeout) {
	var StemHOT = {};
	
	StemHOT.Table = function(idSelector, angularTableObj, angularScope) {
		this.idSelector = idSelector;
		this.node = $(idSelector)[0];
		this.columns = angularTableObj.columns;
		this.data = angularTableObj.value;
		this.scope = angularScope;
		var table = this;
		
		// Setting display data
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
		
		// Initializing hot table
		this.hot = new Handsontable(this.node, {
			data: this.displayData,
		    contextMenu: true,
			colWidths: 150,
		    colHeaders: function (col) {
		    	var txt = '<span style="margin-right: 5px;">' + table.columns[col].name + ' [' + table.columns[col].displayUnit + ']</span>';
		    	return txt;
		    },
		    manualColumnResize: true,
		    manualRowResize: true,
		    cells: function (rowIndex, colIndex, prop) {
                var cellProperties = {};                
                cellProperties = {
                	type: 'numeric',
                    format: table.columns[colIndex].format || '0.00'
                }                
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
	
	// Setting custom events
	StemHOT.Table.prototype.setEvents = function() {
		var table = this;
		this.hot.updateSettings({
			beforeDrawBorders: function() {
				table.overrideInlineCss();
			},
			afterScrollHorizontally: function() {
				table.overrideInlineCss();
			},
			afterContextMenuHide: function() {
				table.overrideInlineCss();
			},
 			afterChange: function(changes, source) {
 				// Updating values on data change
		    	if (source != 'loadData') {
		    		$.each(changes, function(index, change) {
		    			var rowIndex = change[0];
		    			var colIndex = change[1];
		    			var newValue = change[3];
			    		table.data[rowIndex][colIndex] = 
			    			StemQuantities.toSIUnit(
									table.columns[colIndex].quantity, table.columns[colIndex].displayUnit, 
									parseFloat(newValue)
							)
			    	});
		    	}
		    	table.overrideInlineCss();
		    },
			afterCreateCol: function(index, amount) {
				table.columns.splice(index, 0, {name: "c" + String(index+1), quantity: "Dimensionless", displayUnit: "-", unitOptions: ["-"]});
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
			// Building customized column headers
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
			        	table.columns[col].displayUnit = event.target.data.unit;
			        	table.scope.stemTable.columns[col].displayUnit = event.target.data.unit;
			        	table.onUnitChange(col);
			          }
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
        	item;
        menu.className = 'unitMenu';
        for (var i=0, len=unitOptions.length; i<len; i++) {
        	options.push(unitOptions[i][0]);
        }
        for (var i=0, len=options.length; i<len; i++) {
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
	}
	
	
	// Bulding carret button
	StemHOT.Table.prototype.buildUnitMenuButton = function() {
        var button = document.createElement('BUTTON');
        button.innerHTML = '\u25BC';
        button.className = 'changeUnit';
        return button;
    }
	
	
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
    }
	
	// Setting customized context menu
	StemHOT.Table.prototype.setContextMenu = function() {
		var table = this;
		this.hot.updateSettings({
			contextMenu: {
				callback: function (key, options) {
				    if (key === 'edit_col') {
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
					"hsep1": "---------",
					"remove_row": {},
					"remove_col": {},
					"hsep2": "---------",
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
	return StemHOT;
});
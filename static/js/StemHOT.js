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
		    rowHeaders: function (row) {
		    	return String(row);
		    },
		    manualColumnResize: true,
		    manualRowResize: true
		});
		// Getting formats
		this.onColFormatChange();
		// Setting custom events
		this.setEvents();
		// Setting customized context menu
		this.setContextMenu();
	}
	
	StemHOT.Table.prototype.setEvents = function() {
		var table = this;
		this.hot.updateSettings({
			afterChange: function(changes, source) {
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
		    },
			afterCreateCol: function(index, amount) {
				table.columns.splice(index, 0, {name: "new", quantity: "Dimensionless", displayUnit: "-", unitOptions: ["-"]});
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
				table.columns.splice(index, 1);
				for (var i=0; i<table.data.length; i++) {
					table.data[i].splice(index, 1);
				}
			},
			afterRemoveRow: function(index, amount) {
				table.data.splice(index, 1);
			},
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
	
	StemHOT.Table.prototype.buildUnitMenuButton = function() {
        var button = document.createElement('BUTTON');
        button.innerHTML = '\u25BC';
        button.className = 'changeUnit';
        return button;
    }
	
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
					"undo": {}, 
					"redo": {},
					"edit_col": {name: 'Edit column'}
				  }
			}
		});
	};
	
	StemHOT.Table.prototype.onColNameChange = function() {
		this.hot.render();
	};
	StemHOT.Table.prototype.onColFormatChange = function() {
		var table = this;
		var format;
		var formatSettings = [];
		$.each(table.columns, function(colIndex, column) {
			format = column.format || '0.00';
			formatSettings.push({type: 'numeric', format: format});
		});
		this.hot.updateSettings({columns: formatSettings});
	};
	StemHOT.Table.prototype.onUnitChange = function(colIndex) {
		var table = this;
		$.each(table.data, function(rowIndex, row) {
			table.displayData[rowIndex][colIndex] = StemQuantities.fromSIUnit(
    				table.columns[colIndex].quantity, table.columns[colIndex].displayUnit, 
    				row[colIndex]);
		});
		this.hot.render();
	};
	return StemHOT;
});
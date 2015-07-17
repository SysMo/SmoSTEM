Stem.factory('StemHOT', function(StemQuantities, StemUtil, $timeout) {
	var StemHOT = {};
	StemHOT.Table = function(idSelector, columns, data) {
		var table = this;
		//this.scope = angularScope;
		this.idSelector = idSelector;
		this.node = $(idSelector)[0];
		this.columns = columns;
		this.data = data;
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
			//rowHeaders: true,
			data: this.displayData,
		    contextMenu: true,
		    colHeaders: function (col) {
		    	var txt;
		    	txt = table.columns[col].name;
		    	txt = '<span>' + table.columns[col].name + '</span> ';
		    	txt += '<span>[' + table.columns[col].displayUnit + ']</span>';
		    	return txt;
		    },
		    rowHeaders: function (row) {
		    	return String(row);
		    },
		    manualColumnResize: true,
		    manualRowResize: true
		});
		// Setting custom events
		this.setEvents();
		// Setting customized context menu
		this.setContextMenu();
	}
	
	StemHOT.Table.prototype.setEvents = function() {
		var table = this;
		this.hot.updateSettings({
			afterChange: function(changes, source) {
				console.log(source);
				console.log(changes);
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
			}
		});
	};
	
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
	
	StemHOT.Table.prototype.onUnitChange = function(colIndex) {
		var table = this;
		$.each(table.data, function(rowIndex, row) {
			table.displayData[rowIndex][colIndex] = StemQuantities.fromSIUnit(
    				table.columns[colIndex].quantity, table.columns[colIndex].displayUnit, 
    				row[colIndex]);
		});
		this.hot.render();
	};
	StemHOT.Table.prototype.onColPropChange = function(colIndex) {
		this.hot.render();
	};
	return StemHOT;
});
Stem.factory('StemTable', function(StemQuantities, StemUtil) {
	var StemTable = {};
	StemTable.Table = function(idSelector, columns, value) {
		this.idSelector = idSelector;
		this.tableNode = $(idSelector)[0];
		this.columns = columns;
		this.data = value;
		this.renderTable();
	}
	StemTable.Table.prototype.renderTable = function() {
		this.tableNode.innerHTML = "";
		var table = this;
		columns = angular.copy(this.columns);
		// Column row
		var node = document.createElement("TR");
		var row = this.tableNode.appendChild(node);
		node = document.createElement("TD");
		node.innerHTML = '#';
		row.appendChild(node);
		for (var j=0; j<columns.length; j++) {
			node = document.createElement("TD");
			node.setAttribute("data-col", j);
			var cell = row.appendChild(node);
			cell.innerHTML = columns[j].name;
			cell.addEventListener('contextmenu', function(ev) {
	            ev.preventDefault();
	            $.contextMenu({
	            	position: function(opt, x, y){opt.$menu.css('display', 'block').position({ my: "left top", at: "center center", of: $(ev.target)}).css('display', 'none'); },
	    			selector: "body",
	    			reposition: false,
	    			events: {  
	    				hide: function() {
	    					$.contextMenu('destroy');
	    				}
	    			},
	                callback: $.proxy(function(key, options) {
	                	switch(key){
	    					case "addColumnBefore":
	    						this.addColumn(parseInt(ev.target.dataset.col));
	    						break;
	    					case "addColumnAfter":
	    						this.addColumn(parseInt(ev.target.dataset.col), 'after');
	    						break;
	    					case "delColumn":
	    						this.delColumn(parseInt(ev.target.dataset.col));
	    						break;
	    					case "editColumn":
	    						this.editColumn(parseInt(ev.target.dataset.col));
	    						break;
	    					case "clearColumn":
	    						this.clearColumn(parseInt(ev.target.dataset.col));
	    						break;
	    					default:
	    						break;
	                	}
	                }, table),
	                items: 
	                {
	                    "addColumnBefore":    {name: "Add column before", icon: "edit"},
	                    "addColumnAfter":    {name: "Add column after", icon: "edit"},
	                    "delColumn": {name: "Delete column", icon: "edit"},
	                    "editColumn": {name: "Edit column", icon: "edit"},
	                    "clearColumn": {name: "Clear column", icon: "edit"},
	                }
	            });
	            return false;
	        }, false)
		}
		// Unit row
		var node = document.createElement("TR");
		var row = this.tableNode.appendChild(node);
		node = document.createElement("TD");
		node.innerHTML = '[]';
		row.appendChild(node);
		for (var j=0; j<columns.length; j++) {
			node = document.createElement("TD");
			var cell = row.appendChild(node);
			cell.innerHTML = '[' + columns[j].displayUnit + ']';
		}
		
		for (var i=0; i<this.data.length; i++) {
			node = document.createElement("TR");
		    row = this.tableNode.appendChild(node);
		    node = document.createElement("TD");
		    node.setAttribute("data-row", i);
		    node.innerHTML = i;
		    node.addEventListener('contextmenu', function(ev) {
	            ev.preventDefault();
	            $.contextMenu({
	            	position: function(opt, x, y){opt.$menu.css('display', 'block').position({ my: "left top", at: "center center", of: $(ev.target)}).css('display', 'none'); },
	    			selector: 'body',
	    			reposition: false,
	    			events: {  
	    				hide: function() {
	    					$.contextMenu('destroy');
	    				}
	    			},
	                callback: $.proxy(function(key, options) {
	                	switch(key){
	    					case "addRowBefore":
	    						this.addRow(parseInt(ev.target.dataset.row));
	    						break;
	    					case "addRowAfter":
	    						this.addRow(parseInt(ev.target.dataset.row), 'after');
	    						break;
	    					case "delRow":
	    						this.delRow(parseInt(ev.target.dataset.row));
	    						break;
	    					case "resize":
	    						promptVal = prompt("Please enter number of rows", "");
	    						if (promptVal != null) {
	    							this.resize(parseInt(promptVal));
	    						}
	    						break;
	    					default:
	    						break;
	                	}
	                }, table),
	                items: 
	                {
	                    "addRowBefore":    {name: "Add row before", icon: "edit"},
	                    "addRowAfter":    {name: "Add row after", icon: "edit"},
	                    "delRow":    {name: "Delete row", icon: "edit"},
	                    "resize": {name: "Resize", icon: "edit"}  
	                }
	            });
	            return false;
	        }, false);
		    row.appendChild(node);
		    for (j=0; j<this.columns.length; j++) {
		    	node = document.createElement("TD");
		        cell = row.appendChild(node);
		        cell.innerHTML = "<input data-row='" + i + "' data-col='" + j + "'/>";
		        var numValue = StemQuantities.fromSIUnit(
	    				this.columns[j].quantity, this.columns[j].displayUnit, 
	    				this.data[i][j]);
		        cell.childNodes[0].value = StemUtil.numeralFormat(this.columns[j].format, numValue);
		    }
		}
		
		this.COLCELLS=[].slice.call($(this.idSelector + " tr:nth-child(1) > td"));
		this.COLCELLS.splice(0, 1);
		this.UNITCELLS=[].slice.call($(this.idSelector + " tr:nth-child(2) > td"));
		this.UNITCELLS.splice(0, 1);
		this.INPUTS=[].slice.call($(this.idSelector + " input"));
		this.INPUTS.forEach(function(elm) {
			elm.onclick = function(e) {
				elm.select();
			};
		    elm.onblur = function(e) {
		    	table.data[elm.dataset.row][elm.dataset.col] = 
		    		StemQuantities.toSIUnit(
		    				table.columns[elm.dataset.col].quantity, table.columns[elm.dataset.col].displayUnit, 
							numeral().unformat(elm.value));
		    	elm.value = StemUtil.numeralFormat(table.columns[elm.dataset.col].format, numeral().unformat(elm.value));
		    };
		});
		$('body:not(.context-menu-list)').click(function() {
        	$('.context-menu-list').contextMenu("hide");
        });
		
	};
	
	StemTable.Table.prototype.onColPropChange = function(colIndex) {
		this.COLCELLS[colIndex].innerHTML = this.columns[colIndex].name;
	};
	
	StemTable.Table.prototype.onColFormatChange = function(colIndex) {
		var table = this;
		this.INPUTS.forEach(function(elm) {
			if (elm.dataset.col == colIndex) {
				elm.value = StemUtil.numeralFormat(table.columns[elm.dataset.col].format, table.data[elm.dataset.row][colIndex]);
			}
	    });
	};
	
	StemTable.Table.prototype.onUnitChange = function(colIndex) {
		var table = this;
		this.UNITCELLS[colIndex].innerHTML = '[' + this.columns[colIndex].displayUnit + ']'; 
		this.INPUTS.forEach(function(elm) {
			if (elm.dataset.col == colIndex) {
				var numValue = StemQuantities.fromSIUnit(
	    				table.columns[colIndex].quantity, table.columns[colIndex].displayUnit, 
	    				table.data[elm.dataset.row][colIndex]);
				elm.value = StemUtil.numeralFormat(table.columns[elm.dataset.col].format, numValue);
			}
	    });
	};
	
	StemTable.Table.prototype.addRow = function(index, where) {
		if (where == 'after') {
			index = index + 1;
		}
		var newRow = [];
		for (var i=0; i<this.columns.length; i++) {
			newRow.push(0);
		}
		this.data.splice(index, 0, newRow);
		this.renderTable();
	};
	StemTable.Table.prototype.delRow = function(index) {
		this.data.splice(index, 1);
		this.renderTable();
	};
	StemTable.Table.prototype.resize = function(numRows) {
		if (numRows <= this.data.length) {
			this.data.splice(numRows, this.data.length - numRows);
		} else {
			var dataLength = this.data.length;
			var newRow = [];
			for (var i=0; i<this.columns.length; i++) {
				newRow.push(0);
			}
			for (var i=0; i<numRows - dataLength; i++) {
				this.data.push(angular.copy(newRow));
			}
		}
		this.renderTable();
	};
	StemTable.Table.prototype.addColumn = function(index, where) {
		if (where == 'after') {
			index = index + 1;
		}
		this.columns.splice(index, 0, {name: "new", quantity: "Dimensionless", displayUnit: "-", unitOptions: ["-"]});
		for (var i=0; i<this.data.length; i++) {
			this.data[i].splice(index, 0, 0);
		}
		this.renderTable();
		this.editColumn(index);
	};
	StemTable.Table.prototype.delColumn = function(index) {
		this.columns.splice(index, 1);
		for (var i=0; i<this.data.length; i++) {
			this.data[i].splice(index, 1);
		}
		this.renderTable();
	};
	StemTable.Table.prototype.editColumn = function(index) {
		this.activeColumnIndex = index;
		$(this.idSelector + "-columnModal").modal("show");
	};
	StemTable.Table.prototype.clearColumn = function(index) {
		for (var i=0; i<this.data.length; i++) {
			this.data[i][index] = 0;
		}
		this.renderTable();
	};
	return StemTable;
});
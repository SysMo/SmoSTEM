module.exports = function(grunt) {

// Project configuration.
grunt.initConfig({
	pkg : grunt.file.readJSON('package.json'),
	uglify : {
		options : {
			banner : '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
		},
		build : {
			src : '../static/js/<%= pkg.name %>.js',
			dest : '../static/js/<%= pkg.name %>.min.js'
		}
	},	
	concat : {
		distSrc : {
			options : {
				separator : ';'
			},
			// the files to concatenate
			src : '<%= pkg.srcFiles %>',
			// the location of the resulting JS file
			dest : '../static/js/<%= pkg.name %>.js'
		},
		distTemplates : {
			options : {
				banner: '{% raw %}\n',
				footer: '\n{% endraw %}'
			},
			// the files to concatenate
			src : '<%= pkg.templateFiles %>',
			// the location of the resulting JS file
			dest : '../templates/angular/<%= pkg.name %>AngularTemplates.html'
		},
		
		
//		distLib : {
//			// the files to concatenate
//			src : '<%= pkg.libFiles %>',
//			// the location of the resulting JS file
//			dest : '../static/js/<%= pkg.name %>ExtLibs.js'
//		}
	},
	jshint : {
		files : '<%= pkg.srcFiles %>',
		options : {
			// options here to override JSHint defaults
			globals : {
				jQuery : true,
				console : true,
				document : true
			}
		}
	},
	watch : {
		files : [ '<%= pkg.srcFiles %>' ],
		tasks : [ 'default' ]
	}
});

grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-watch');

grunt.registerTask('merge', ['concat:distSrc', 'concat:distTemplates']);
grunt.registerTask('default', [ 'jshint', 'concat', 'uglify' ]);
};
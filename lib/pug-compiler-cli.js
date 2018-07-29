#!/usr/bin/env node

"use strict";

// Include native libs
const fs = require( 'fs' );
const pathp = require( 'path' );

// Include extrernal libs
const pug = require( 'pug' );
const extend = require( 'extend' );
const commandLineArgs = require( 'command-line-args' );
const chalk = require('chalk');

// Declare CLI options
const optionDefinitions = [
  { name: 'conf', alias: 'c', type: String, defaultValue: '.config/' },
  { name: 'env', alias: 'e', type: String },
  { name: 'src', alias: 's', type: String },
  { name: 'dest', alias: 'd', type: String }
];

// CLI arguments lib
const options = commandLineArgs( optionDefinitions, { partial: true} );

// Read config files
var conf = JSON.parse( fs.readFileSync( ( pathp.join(process.cwd(), options.conf, 'config.json') ), 'utf8' ) );
var env_conf = JSON.parse( fs.readFileSync( ( pathp.join(process.cwd(), options.conf, options.env + '.json') ), 'utf8' ) );

var path = {
  basedir: options.src,
  basedirDist: options.dest
}

//Extend default conf with env conf
extend( conf, env_conf );

//Read Html directory
fs.readdir( path.basedir, function( err, files ) {
  if( err ) {
    throw err;
  }

  files.forEach( function( file ) {
  	if( pathp.extname( file ) == '.pug' ){
	  	var name = pathp.basename( file, '.pug' );	  	
	  	if( options.env != 'starter' || ( options.env == 'starter' && matchArray( conf.compile, name )) ){
		  	generateHmtl( name );
	  	}
  	}
  })
});

//Return true when the name file exist in starter env config
function matchArray( arrayStarter, name ){	
	for( var i = 0; i <= arrayStarter.length; i++ ) {
		if( arrayStarter[i] == name ){
			return true;
		}
	}
}

function generateHmtl( name ){
	//Compile pug and get the html
	var html = pug.renderFile( path.basedir+ name +'.pug', {
		basedir: path.basedir,
		pretty: true,
		conf: conf,
		filters: {
			escape: require( '../pug-filters/pug-escape.js' ),
			php: require( '../pug-filters/pug-php.js' )
	  }
	});
	
	//Rename to index file on starter
	name = options.env == 'starter' && conf.rename == name ? 'index' : name;

	//Validate that directory exist
	if( !fs.existsSync( path.basedirDist ) ){
		fs.mkdirSync( path.basedirDist );
	}

	//Create the html file
	fs.writeFile(path.basedirDist + name +'.'+ conf.pagesExtension, html, function( err ) {
	  if( err ){
	  	console.log(chalk.red( err ) )	  	
	  }else{
	  	console.log(chalk.green(' [pug-compiler]: ' + name + "." + conf.pagesExtension + " was generated" ));
	  }	  
	});	
}
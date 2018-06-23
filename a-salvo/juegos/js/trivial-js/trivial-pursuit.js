/*
Dependencies:
	jQuery
	Bootstrap 4, js and css

How it works:
	Declare a container in html, ie <div id='playground'></div> 
	+
	var theGame = $( '#playground' ).trivialGame({
		       playerNames: [ 'Alvaro', 'Pedro' ]
		    });
*/



(function ( $ ) {
	
		// this is the first call of the plugin, it wil call the init of the game 
	    $.fn.trivialGame = function( options ) {
						
			var instance = (new trivialGame( jQuery(this) )).init(options);
			return instance;
		}



		"use strict";
		var trivialGame = function(jEl) {

			var game = this;   	// This will allow to access to all elements, fns and propierties.   ie. game.Dice().rollDice();
			
			// Setting all the options.
			// Properties for the game: options, jElement
			// access with game.options
			game.optionsDefault = {				
				playerNames: 		[ "Alvaroa", "Peddro" ], // send the real array of names when creating the game
				game_online: 		false,
				board_svg_file:  	'boardtrivial-board.svg',
				num_casillas: 		10,
				questions_file: 	'questions-2.json',
				time_per_question: 	5 // in secs				
			};

			// Access to HTML objects
			game.jElement 	= jEl; 		// the parent container html jqeury. (the #playground)
			game.jBoard 	= null; 	// the <svg>
			game.jQuestionContainer = null;  // where the modal window is created to display the question and answers

			game.players 		= [];   // see below, the componenr Player(i). Every player is one of this Objects. game.players[0] corresponds to player 1
			game.current_player = 0; 	// From 1 to 4. To access to the current player object use game.players[game.current_player - 1]
			game.player_colors 	= [ 'red', 'blue', 'yellow', 'orange'];

			// access to the Dice object from outside the Dice
			game.dice 			= null;

			// related also to the quesitos. Every quesito correspond to a type, and takes the colour of the type
			game.countdown_interval = null
			game.typeQuestions 		= {
				type_1: 	{ name: 'colores', color: 'blue' } ,
				type_2: 	{ name: 'animales', color: 'green' } ,
				type_3: 	{ name: 'deportes', color: 'yellow' } ,
				type_4: 	{ name: 'historia', color: 'blue' } ,
				type_5: 	{ name: 'culturas', color: 'cyan' } ,				
			};

			// related to the questions
			game.questions 		= null; 	// seran cargadas de un json desde options.questions_file

	/*************************************************************************
	************  // THE GAME:  Init Game in the container jEl
	*************************************************************************/

			game.init = function( options ) {
				
				// Merging options with defaults
				game.options = jQuery.extend(game.optionsDefault, options);
				
				// cleanup, now we'll load the svg and init everything
				game.jElement.html('');

				// Load the Board SVG image, in HTML
				$('<div></div>').addClass('board-svg-container').load(game.options.board_svg_file, function() { 

					game.jElement.css('height', '80vh');
					// Init this var
					game.jBoard = game.jElement.find('#board');

					// Init the DICE
					game.dice 	= new Dice().init();
					
					// Init every PLAYER. for eaveryplayer  we create tje Object Player and save it. Then we'll access with "game.players[numberplayer - 1]"
					jQuery.each( game.options.playerNames, function(index, playerName) { 						
						
						game.players[index] 	= new Player(index + 1).init( playerName );
						
					} );

					// init casillas. The information is in the html as attributes set by hand: 
					// 	data-casilla (1..num_casillas), data-tema (1..5), data-queso (true/null)
					for ( var cas = 1; cas <= game.options.num_casillas; cas++ ) {
						var jCasilla = game.jBoard.find('#casilla_'+cas);
						jCasilla.attr('data-casilla', cas);
						if (cas == 1 || cas == 6 ) 	jCasilla.attr('data-tema', 1);	// tema 1 is the red one
						if (cas == 2 || cas == 7 ) 	jCasilla.attr('data-tema', 2);  // green
						if (cas == 3 || cas == 8 ) 	jCasilla.attr('data-tema', 3);  // yellow
						if (cas == 4 || cas == 9 ) 	jCasilla.attr('data-tema', 4);  // blue
						if (cas == 5 || cas == 10 )	jCasilla.attr('data-tema', 5);  // cyan

						if ( (cas == 1) || (cas == 7) || (cas == 5) || (cas == 3) || (cas == 9) )
							jCasilla.attr('data-queso', true);
					};


					// init the questions container
					game.jQuestionContainer = $('<div></div>').addClass('question-container')							
					game.jElement.append(game.jQuestionContainer);


					// init the logic. 

					// questions.json:	Init the questions array from file
					$.getJSON( game.options.questions_file, function( data ) {
						
						console.log('questions loaded '+game.options.questions_file);
						game.questions = data;
					  	$.each( game.questions, function(index, value) { // index is 'type_X', value is the array of questions
							game.questions[ index+"_already_asked"] = [];
						} );
						// console.log(game.questions);
					    
					});
					

					// 		We set to the last player and move to the next one (which will set it to the 1st one)
					game.current_player 	= game.players.length; 		
					game.fn_giveTurnToNextPlayer();

				}).appendTo( game.jElement );							


				
				
								
				
				return game;
			}





			// THE GAME: turno. El proceso más importante. Los pasos de un turno: tiro de dado, seleccionar casilla, responder pregunta

			this.fn_turn 	= function() {


				// 1) Tiro del dado, su animacion
												
				game.dice.fn_rollDice();

				console.log( 'resultado dado ' + game.dice.number );

				// 2) Marcaje de las casillas posibles. 
				var posible_casilla_up  	= parseInt(game.players[game.current_player - 1].casilla) + parseInt(game.dice.number);
				var posible_casilla_down 	= parseInt(game.players[game.current_player - 1].casilla) - parseInt(game.dice.number);
				if (posible_casilla_up > game.options.num_casillas) 	posible_casilla_up 		= posible_casilla_up - game.options.num_casillas;
				if (posible_casilla_down < 1) 	posible_casilla_down 	= posible_casilla_down + game.options.num_casillas;
				console.log( game.players[game.current_player - 1].casilla + ' +- '+game.dice.number+' : ' +posible_casilla_up + ';;' + posible_casilla_down );

				//  mark up the possible casillas
				if (posible_casilla_up == posible_casilla_down) posible_casilla_down = 'dont-select-anything';
				posible_casilla_up 		= game.jBoard.find( '#casilla_'+posible_casilla_up );
				posible_casilla_down 	= game.jBoard.find( '#casilla_'+posible_casilla_down );

				
				// 4) onclick casilla: interaction with the possible square
				$.merge(posible_casilla_up, posible_casilla_down).bind( 'click',
					function(e) {
						
						// when clicking we move the current player						
						game.players[game.current_player - 1].fn_movePlayer( $(this).attr('data-casilla') );

						// remove events and class from qeuares
						game.jBoard.find('.casilla_animada').attr('class', 'transparent-and-border').unbind('click');

						// ask the question to the game.current_player
						setTimeout(function(){ 
							game.fn_askQuestion();
						}, 2000);
						
					}
				).attr('class', 'casilla_animada');
				

				




			}









			this.fn_askQuestion = function() {

				// 1) find the question. The type of question is in the html casilla element (was set 'by hand' on game init)
				var thePlayer 		= game.players[game.current_player - 1];
				var typeOfQuestion 	= 'type_'+game.jBoard.find('#casilla_'+thePlayer.casilla).attr('data-tema');

				var setOfQuestions 	= game.questions[typeOfQuestion];
				
				if (!setOfQuestions.length) { 
					alert('Se han agotado todas las preguntas de esta seccion. A partir de ahora se repetiran');
					// in this array we poured all questions, now we move them back
					game.questions[typeOfQuestion] = setOfQuestions = game.questions[ typeOfQuestion+"_already_asked" ]; 
					game.questions[ typeOfQuestion+"_already_asked" ] = [];					
				}

				var question_index = Math.floor( ( Math.random() * setOfQuestions.length ) ); // To do: avoid repeating questions
				var theQuestion = setOfQuestions[question_index];
				
				// chapuza: borrar la pregunta de la lista de preguntas, para evitar preguntarla de nuevo
				var updatedSetOfQuestions = [];
				for (i = 0; i < setOfQuestions.length ; i++) {
					if ( i != question_index) 
						updatedSetOfQuestions.push( setOfQuestions[i] );
					else game.questions[typeOfQuestion+'_already_asked'].push(setOfQuestions[i]);
				}
				game.questions[typeOfQuestion] = updatedSetOfQuestions;

				// creating the question container, this modal structure depend on bootstrap 4 modal css and  modal js
				game.jQuestionContainer.append('<div class="question-modal modal hide fade modal-sm mx-auto" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true"> \
					<div class="modal-dialog modal-dialog-centered"> <div class="modal-content">\
					<div class="modal-header"></div>\
					<div class="modal-body"><ul></ul></div>\
					<div class="modal-footer"><div class="countdown w-50"></div><div class="tema w-50"></div></div>\
					</div></div></div>'); // close content dialog and modal
		
				game.jQuestionContainer.find('.modal-header').text(theQuestion.question);
				game.jQuestionContainer.find('.tema').text(game.typeQuestions[typeOfQuestion].name);
				game.jQuestionContainer.find('.countdown').text(game.options.time_per_question);

				// Creation of the countrdown and behaviour
				var timeleft = 10;
				game.countdown_interval = setInterval(function(){
					var time_left = parseInt(game.jQuestionContainer.find('.countdown').text()) - 1;
					game.jQuestionContainer.find('.countdown').text(time_left);
  						
  					if(time_left <= 0) {    					
    					// proceed to the time left. Close the question , show a message and 
    					game.fn_answerQuestion( game.jQuestionContainer.find('.countdown') );
  					}
				},1000);

				// apply class g or b to every answer, so we know which is the right one, and paint it properly
				for ( var i = 0; i < theQuestion.answers.length; i++ ) {
					var answer = theQuestion.answers[i];					
					var class_ok = (i == theQuestion.right_answer)? 'g' : 'b' ; 		// the class g (good) indicates this is the right answer
					game.jQuestionContainer.find('.modal-body ul').append('<li><a class="'+class_ok+'" href="#">'+answer+'</a></li>');
				}

				

				// bind event on click any answer
				game.jQuestionContainer.find('.modal-body a').bind('click', function(e){
					e.preventDefault();
					game.fn_answerQuestion($(this)); // jquery of the <a> clicked

				});
				

				game.jQuestionContainer.find('.question-modal').modal('show');

			}

			this.fn_answerQuestion = function(jAnswer) {

				// stop timer
				clearInterval(game.countdown_interval);

				// compling info
				var is_right = jAnswer.hasClass('g');

				// visual changes
				game.jQuestionContainer.find('.modal-body a').unbind('click');
				jAnswer.addClass('answered'); // apply css that shows if it's good or bad answer

				// ************** ANSWER IS RIGHT :))) **************
				if (is_right) {
					
					// we add one point in any case
					game.players[game.current_player - 1].fn_addPoint();

					// process el quesito if la casilla es de quesito, y los puntos, y numero de tirada
					var jCurrentCasilla = game.jBoard.find("#casilla_"+game.players[game.current_player - 1].casilla);
					if (jCurrentCasilla.attr('data-queso') == "true"){

						console.log("anadiendo QUESITO "+jCurrentCasilla.attr('data-tema')+" a player "+game.current_player);
						game.players[game.current_player - 1].fn_addQuesito(jCurrentCasilla.attr('data-tema'));

					}

					
				}
				// ************** ANSWER IS WRONG :((( **************
				else {
					//alert('bad answer');
					// process el el numero de tirada					
				}
				
				// destroy the modal dialog with the question
				setTimeout( function() {
					
					game.jQuestionContainer.find('.question-modal').modal('hide');
					setTimeout(function(){ game.jQuestionContainer.html(''); }, 1000);
					
					// Logic changes Give turn to next player if answer was not ok. If not, we reactivate the Dice here
					if (is_right) {
						// update dice with blink effect
						game.dice.allowRoll = true;
						game.dice.jElement.find("#dice-bg").attr('class','casilla_animada orange-bg');
					}
					else
						game.fn_giveTurnToNextPlayer();	 	// this reactivates the Dice and updates everything visually for the next player

				}, 1500);
				
			}


			// when the turn of somebody finished (after anwering a question)
			this.fn_giveTurnToNextPlayer = function() {

				// === LOGIC ===
				console.log('your turn is over '+game.players[game.current_player - 1].name+' ('+game.players[game.current_player - 1].number+')');

				/* -----  We move to the NEXT PLAYER!!   */
				game.current_player++;				
				game.current_player = (game.current_player > game.players.length)? 1 : game.current_player;
				/* -----  We move to the NEXT PLAYER!!   */

				console.log('Now its turn of '+game.players[game.current_player - 1].name+' ('+game.players[game.current_player - 1].number+')');
				
				
				// === VISUAL ELEMENTS ===
				// update current player panel
				game.jBoard.find('#current-player-info #current-player-panel').css('fill', game.player_colors[game.current_player-1])
				game.jBoard.find('#current-player-info text:eq(1)').text(game.current_player);

				// update player info panels (position and size)
				for( var k = 1; k <= game.players.length; k++) {
					var panel =  game.players[ k - 1 ].jPlayerInfo;
					if (k == game.current_player) {
						game.fn_moveElement( panel, game.jBoard.find('#position-markers #position-current'), 1 );
					}
					else {					
						game.fn_moveElement( panel, game.jBoard.find('#position-markers #position-'+k), 0.7 );
					}
				}

				// update players icons (size)
				$.each(game.players, function(index, player) {
					var scale = (player.number == game.current_player )? 1 : 0.6;
					game.fn_updateOnlyScale(player.jPlayerIcon, scale);
				}); 				 

				// update dice with blink effect
				game.dice.allowRoll = true;
				game.dice.jElement.find("#dice-bg").attr('class','casilla_animada orange-bg');

			}



	/*************************************************************************
	************      	DICE - el dado, propiedades, eventos y functiones
	The html container for the dice is inside the .svg file: #dice-number text. There we paint the dice
	*************************************************************************/
			function Dice() { 
				
				// Dice Propierties 
				this.jElement 	= game.jBoard.find('#dice');   // jQuery('<div></div>').addClass('dice-container').text('Tira el dado');
				this.allowRoll 	= true;		// - set to false to avoid that clicking on the roll triggers it
				this.number 	= 0;
				
				var gameDice = this;


				this.init = function() {

					

					// Events for the Dice. 1) click on the dice
					gameDice.jElement.on('click', function(e){ 
					
						// init logic
						if ( !gameDice.allowRoll )	{
							alert( 'no lances ahora');
							return;
						}

						gameDice.allowRoll 	= false;

						//init visual 
						game.dice.jElement.find("#dice-bg").attr('class', 'transparent');

						game.fn_turn(); 
						
						
						

						//game.players[0].fn_movePlayer(7);
						//game.players[1].fn_movePlayer(3);
						// game.fn_moveElement( game.players[0].jElement, jQuery('#casilla_3') );

					});

					console.log('dice initialized. Current value: '+this.number);
					return this;
				}
				// end Dice init


				// Dice functions 

				// simulates the animation of the dice rolling with random numbers
				this.fn_rollDice = function() {

					gameDice.number = Math.floor( ( Math.random() * 6 ) + 1 );
					
					var max_iterations = 10; 					
					for ( var j = iteration = 0; j < max_iterations; j++ ) {

						
						setTimeout( function () { 
							
							iteration++;
							gameDice.jElement.find(' > g').hide().filter('#dice-'+Math.floor( ( Math.random() * 6 ) + 1 )).show();

							if (iteration == max_iterations)  // in the last iteration
								gameDice.jElement.find(' > g').hide().filter('#dice-'+gameDice.number).show();

						}, j*100 );

					}
				}


				

			}
			// end DICE

	/*************************************************************************
	************      	PLAYERS - All players 
	*************************************************************************/
			function Player(i){

				// var gamePlayers = this;
				// game.players[] >> here we save accss to name
				this.name = 'noname';
				this.number = i;
				this.casilla = null;
				this.jElement = null;
				this.jPlayerIcon = null;
				this.jPlayerInfo = null;
				this.jPuntuacion = null;

				// self 	= this;   <<<<< using self  doesnt work inside the fns

				this.init = function(playerGame) {

					this.name 	= playerGame;

					var jPlayer = $('#player').clone().show();
					var color = game.player_colors[this.number - 1];
					jPlayer.attr( 'class', 'player' ).attr( 'id', 'player-'+this.number ).find('#player-body').css('fill', color);
					$('#player').hide();
					//jQuery('<image src="'+game.options.player_src+'"></image>').attr('id', 'player-'+this.number).addClass('player');
					
					this.jElement 	 = jPlayer;
					this.jPlayerIcon = jPlayer.find('#player-icon');
					this.jPlayerInfo = jPlayer.find('#player-info');
					this.jPuntuacion = this.jPlayerInfo.find('text').eq(0);
					this.jPlayerName = this.jPlayerInfo.find('text').eq(1);

					this.jPlayerInfo.find('#player-panel').css('fill', color);
					this.jPlayerName.text( this.name );

					// creacion player
					game.jBoard.append(jPlayer);					

					// set an initial spot and move it
					this.casilla 	= ( 4 + this.number );
					this.fn_movePlayer(this.casilla);


					return this;
				}

				// paints a quesito in the wheel of quesitos. quesito_number = [1..5]. To access to the points use parseInt(player.jPuntuacion.text()) 
				this.fn_addPoint = function() { 
					console.log("add one point to player "+this.number+" ("+this.name+") ");
					this.jPuntuacion.text( parseInt(this.jPuntuacion.text()) + 1 );
				}
				this.fn_addQuesito = function(quesito_number) {  
					var color_quesito 	= game.typeQuestions['type_'+quesito_number].color;
					console.log("anadiendo QUESITO "+quesito_number+" ("+color_quesito+") a player "+this.number+" /"); 
					this.jPlayerInfo.find('#quesito #queso-'+quesito_number).addClass('on').css('fill', color_quesito);
					return true;
				}

				// movs the plaver. usign the fn moveElement
				this.fn_movePlayer = function(casilla_number) {

					this.casilla 	= casilla_number;

					console.log('moviendo jugador '+this.number+' a casilla '+casilla_number);

					game.fn_moveElement( this.jPlayerIcon, game.jBoard.find('#casilla_'+casilla_number ), 1, true );

				}


			}





	/*************************************************************************
	************      	GENERIC FUNCTIONS IN THE GAME ( kind of generic helpers)
	*************************************************************************/
		this.fn_moveElement = function(jElement, jOverTheElement, scale, shift) {
			
			// When using transform (as we do) we need to consider that maybe the viewport is scaled. So we calculate how much it is scaled						
			var originSizes = game.jBoard.attr('viewBox').split(/\s+|,/);  // [0, 0, 630, 300]  , so the width is [2]-[0]
			var widthScale  = game.jBoard.width() / (originSizes[2] - originSizes[0]);
			var heightScale = game.jBoard.height() / (originSizes[3] - originSizes[1]);

			//alert();
			var shift_x 	= (typeof(shif) === 'undefined')? 0 : Math.floor(jElement.get(0).getBBox().width);
			var scale 		= (typeof(scale) === 'undefined')? '' : ' scale('+scale+')';
			var the_x 	= ( Math.floor( jOverTheElement.offset().left - game.jBoard.offset().left ) + shift_x ) / widthScale ;
			var the_y 	= Math.floor( jOverTheElement.offset().top - game.jBoard.offset().top ) / heightScale ;

			jElement.attr('transform', 'translate('+the_x+','+the_y+')'+scale);
			//jElement.css('x', the_x);
			//jElement.css('y', the_y);
			// alert(jElement.attr('id') + '>' + the_x + '////' + the_y );

		}

		// for an element like <g transform="translate(43 234) scale(0.5 0.5)">   replace only the scale leaving the translate the same
		this.fn_updateOnlyScale = function(jElement, scaleValue) {

			var regex = /scale\(.+?\)/i ;  // matches anything like  "scale(2.3 2)"
			var transformAttr = jElement.attr('transform');
			var match = regex.exec(transformAttr);  // now match[0] should be "scale(2.3 2)"
			if (match.length) {
				var newTransform = transformAttr.replace(match[0], " scale("+scaleValue+") ");
				jElement.attr("transform", newTransform);
			}

			return newTransform;
		}



	}
 
}( jQuery ));
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
				playerNames: 			[ "Alvaroa", "Peddro" ], // send the real array of names when creating the game
				board_svg_file:  	'boardtrivial-board.svg',
				num_casillas: 		10
				// player_src: 		'player.png'
			};

			game.jElement 	= jEl; 		// the parent container html jqeury. (the #playground)
			game.jBoard 	= null;

			game.players 		= [];   // see below, the componenr Player(i). Every player is one of this Objects. game.players[0] corresponds to player 1
			game.current_player = 0; 	// From 1 to 4. To access to the current player object use game.players[game.current_player - 1]
			game.player_colors 	= [ 'red', 'blue', 'yellow', 'orange'];

			// related also to the quesitos. Every quesito correspond to a type, and takes the colour of the type
			game.typeQuestions 		= {
				type_1: 	{ name: 'colores', color: 'blue' } ,
				type_2: 	{ name: 'animales', color: 'green' } ,
				type_3: 	{ name: 'deportes', color: 'yellow' } ,
				type_4: 	{ name: 'historia', color: 'blue' } ,
				type_5: 	{ name: 'culturas', color: 'cyan' } ,				
			};
			game.questions 		= {

				type_1:  [  
					{
						question: ' De qué color es el cielo?',
						answers: [ 'azul', 'verde', 'amarillo', 'rojo'],
						right_answer:  0,						
					},
					{
						question: 'El agua tiene color?',
						answers: [ 'sí', 'no' ],
						right_answer:  1
					},
				],
				type_1_already_asked: [],

				type_2:  [  
					{
						question: 'Cuántas patas tiene un perro?',
						answers: [ '1', '2', '3', '4'],
						right_answer:  3
					},
					{
						question: 'Cuántos estómagos tiene una vaca?',
						answers: [ 'hombre pues 1', '2', '3', '1000'],
						right_answer:  1
					},
				],
				type_2_already_asked: [],

				type_3:  [  
					{
						question: 'Quién es pichichi de una liga de fútbol?',
						answers: [ 'El futbolista más guapo', 'El portero que menos goles ha encajado', 'El jugador que más goles ha marcado'],
						right_answer:  2
					},
					{
						question: 'Cuántos campeonatos mundiales tiene España?',
						answers: [ 'ninguno', '1', '2', '3'],
						right_answer:  1
					},
					
				],
				type_3_already_asked: [],

				type_4:  [  
					{
						question: 'Los Reyes Católicos era Isabel y ...?',
						answers: [ 'Pedro', 'Antonio', 'Juana la Loca', 'Fernando'],
						right_answer:  3
					},
					{
						question: 'En qué año se descubrió América?',
						answers: [ 'año 0', '1988', '1492', '1000'],
						right_answer:  2
					},
				],
				type_4_already_asked: [],

				type_5:  [  
					{
						question: 'Como se dice HOLA en italiano?',
						answers: [ 'ola', 'all in', 'arrivederci', 'ciao'],
						right_answer:  3
					},
					{
						question: 'Cuántos idiomas oficiales hay en España?',
						answers: [ 'ninguno', 'sólo 1: el español', '4: es español, el catalán, el euskera y el gallego', 'más de 1000'],
						right_answer:  2
					},
				],
				type_5_already_asked: [],

			};

	/*************************************************************************
	************  // THE GAME:  Init Game in the container jEl
	*************************************************************************/

			game.init = function( options ) {
				
				// Merging options with defaults
				game.options = jQuery.extend(game.optionsDefault, options);

				// Load the Board SVG image, in HTML
				$('<div></div>').addClass('board-svg-container').load(game.options.board_svg_file, function() { 

					game.jElement.css('height', '80vh');
					// Init this var
					game.jBoard = game.jElement.find('#board');

					// Init the DICE
					game.dice 	= new Dice().init();
					
					// Init every PLAYER. for eaveryplayer  we create tje Object Player and save it in the array game.players					
					jQuery.each( game.options.playerNames, function(index, playerName) { 						
						
						game.players[index] 	= new Player(index + 1).init( playerName );
						
					} );

					// init casillas. The information is in the html as attributes
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


					// init the logic. We set to the last player and move to the next one (which will set it to the 1st one)
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
				var posible_casilla_up  	= game.players[game.current_player - 1].casilla + game.dice.number;
				var posible_casilla_down 	= game.players[game.current_player - 1].casilla - game.dice.number;
				if (posible_casilla_up > game.options.num_casillas) 	posible_casilla_up 		= posible_casilla_up - game.options.num_casillas;
				if (posible_casilla_down < 1) 	posible_casilla_down 	= posible_casilla_down + game.options.num_casillas;
				console.log( game.players[game.current_player - 1].casilla + ' +- '+game.dice.number+' : ' +posible_casilla_up + ';;' + posible_casilla_down );

				//  mark up the possible casillas
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
					alert('No hay más preguntas que hacer');
					// to do. handle this !
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
					<div class="modal-footer"></div></div></div></div>'); 
		
				game.jQuestionContainer.find('.modal-header').text(theQuestion.question);
				game.jQuestionContainer.find('.modal-footer').text(game.typeQuestions[typeOfQuestion].name);

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
								
				// compling info
				var is_right = jAnswer.hasClass('g');

				// visual changes
				game.jQuestionContainer.find('.modal-body a').unbind('click');
				jAnswer.addClass('answered'); // apply css that shows if it's good or bad answer

				if (is_right) {
					//alert('good answer');
					// process el quesito, y los puntos, y numero de tirada
					
				}else {
					//alert('bad answer');
					// process el el numero de tirada
				}

				// destroy the modal dialog with the question
				setTimeout( function() {
					
					game.jQuestionContainer.find('.question-modal').modal('hide');
					setTimeout(function(){ game.jQuestionContainer.html(''); }, 1000);
					
					// Logic changes Give turn to next player
					game.fn_giveTurnToNextPlayer();	

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
				game.dice.allowRoll = true;
				
				// === VISUAL ELEMENTS ===
				// update current player panel
				game.jBoard.find('#current-player-info #current-player-panel').css('fill', game.player_colors[game.current_player-1])
				game.jBoard.find('#current-player-info text:eq(1)').text(game.current_player);

				// update player info panels
				for( var k = 1; k <= game.players.length; k++) {
					var panel =  game.players[ k - 1 ].jPlayerInfo;
					if (k == game.current_player) {
						game.fn_moveElement( panel, game.jBoard.find('#position-markers #position-current'), 1 );
					}
					else {					
						game.fn_moveElement( panel, game.jBoard.find('#position-markers #position-'+k), 0.7 );
					}
				}

				// update dice with blink effect
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

					this.jPlayerInfo.find('#player-panel').css('fill', color);

					// creacion player
					game.jBoard.append(jPlayer);					

					// set an initial spot and move it
					this.casilla 	= ( 4 + this.number );
					this.fn_movePlayer(this.casilla);


					return this;
				}

				// movs the plaver. usign the fn moveElement
				this.fn_movePlayer = function(casilla_number) {

					this.casilla 	= casilla_number;

					console.log('moviendo jugador '+this.number+' a casilla '+casilla_number);

					game.fn_moveElement( this.jPlayerIcon, game.jBoard.find('#casilla_'+casilla_number ), 1, true );

				}


			}





	/*************************************************************************
	************      	GENERIC FUNCTIONS IN THE GAME
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




		}
	 
	}( jQuery ));
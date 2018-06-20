Trivial JS. 
Por @cobianzo y @shankao

ESTRUCTURA
=================
La estructura 
  /css
  /js
  /img
  /scss
  /vendor
  gulpfile.js
  package.json

Corresponde a un Boilerplate para tener una estrucutra basada en jQuery y Bootstrap 4. 
No usamos SASS. nuestros juegos son css puro


COMO HACER FUNCIONAR EL JUEGO
===================
El juego en si está todo en

/js/trivial-js/ ...

Para hacerlo funcionar basta con

    theGame = $( '#playground' ).trivialGame({
             playerNames: [ 'Alvaro', 'Pedro' ],
             board_svg_file:    'js/trivial-js/boardtrivial-board.svg',
          });
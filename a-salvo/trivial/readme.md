Trivial JS. 
Por @cobianzo y @shankao

ESTRUCTURA archivos del proyecto
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
================================================================================
El juego en si está todo en

/js/trivial-js/ ...

Para hacerlo funcionar basta con

    theGame = $( '#playground' ).trivialGame({
             playerNames: [ 'Alvaro', 'Pedro' ],
             board_svg_file:    'js/trivial-js/boardtrivial-board.svg',
          });

Las siguientes instrucciones de la estructura de datos se basan en que el jeugo se ha inicializado con la variable theGame





EL JUEGO: VISTA GENERAL A LA ESTRUCTURA DE DATOS
================================================================================

Tres componentes


Raiz de plugin: todo lo que tiene que ver con el 
-----------------------------------
- juego
- tablero
- las preguntas

Acceso a los métodos y propiedades del juego

> this.whatever                       (dentro del plugin, sin meterse en ninguna subfuncion, a menos que este declarada del modo this.fnname = function() {} )
- game.whatever                       (desde dentro del plugin, dentro de otras subfunciones, donde 'this' ya tiene otro scope )
> theGame.whatever                    (desde fuera del plugin)



Dice: El dado. Todo lo relativo al dado
-----------------------------------
Acceso al objeto Dice, sus propiedades y métodos:

> this.whatever or gameDice.whatever  (desde dentro del objeto Dice)
> game.dice                           (desde fuera del objeto Dice)
> theGame.dice                        (desde fuera del plugin)


Player(i)   (i in [1..4], es el numero de jugador)
-----------------------------------
Acceso al objeto Player(i), sus propiedades y métodos:

> this.whatever               (desde dentro del objeto Player)
- game.players[ 0..3 ]        (desde fuera del objeto Player, dentro del plugin. Nótese que va de 0 a 3 y no de 1 a 4 -se resta 1-)
- theGame.players[ 0..3 ]     (desde fuera del plugin)




Para cada uno de estos dos componentes, tenemos (he puesto de ejemplo el ´game´, pero vale para Dice y Player(i) )

> game.(propriedad o método)
> game.propiedad
> game.jNombreElementoHTML
> game.fn_nombrefuncion()




ESTRUCTURA DE DATOS EN DETALLE
================================================================================
/* TypeBlitz word lists — original common-vocabulary lists written for this app. */
(function () {
  'use strict';

  var EN = (
    'the be to of and a in that have it for not on with he as you do at this but his by ' +
    'from they we say her she or an will my one all would there their what so up out if ' +
    'about who get which go me when make can like time no just him know take people into ' +
    'year your good some could them see other than then now look only come its over think ' +
    'also back after use two how our work first well way even new want because any these ' +
    'give day most us are was were has had been more very much many such may should ' +
    'between through during before again once here why while where both each few those ' +
    'being under never always often still must might every great small large old young ' +
    'long little own same another light night house home world life hand eye heart mind ' +
    'water fire earth air sun moon star sky sea river road city town street door window ' +
    'morning evening night week month today tomorrow yesterday quick brown fox jumps lazy ' +
    'dog cat bird fish tree flower grass green blue red black white happy sad big fast ' +
    'slow high low far near left right up down open close start stop play run walk talk ' +
    'speak write read learn teach help love live laugh smile dream sleep eat drink drive ' +
    'fly swim sing dance build break bring buy catch choose clean climb cook count cry ' +
    'cut draw drink drive enjoy fight find fly forget grow hear hold keep leave listen ' +
    'lose meet move need pay pull push put quit rain reach ride ring rise shake share ' +
    'shoot show shut spend stand steal swim swing take teach tear tell throw touch try ' +
    'turn visit wait wake wear win wonder write wrong young youth zero zone zoom'
  ).split(' ');

  var FR = (
    'le la les de des du un une et est en que qui dans pour pas au par sur avec plus ' +
    'comme mais ou donc tout tous toute toutes ce cette ces il elle ils elles nous vous ' +
    'je tu on mon ma mes ton ta tes son sa ses notre votre leur temps jour monde vie ' +
    'homme femme enfant maison travail chose main nuit porte ville pays eau feu air terre ' +
    'ciel soleil matin soir semaine mois heure minute ami famille amour livre mot langue ' +
    'grand petit bon mauvais nouveau vieux jeune beau long court haut bas fort faible ' +
    'chaud froid rapide lent premier dernier autre chaque beaucoup peu bien mal mieux ' +
    'souvent toujours jamais parfois encore maintenant hier demain ici loin avant pendant ' +
    'entre sans sous vers pourquoi comment quand combien quel quelle merci oui non salut ' +
    'bonjour soir nuit blanc noir rouge vert bleu jaune facile difficile vrai faux ' +
    'possible impossible parler manger boire dormir marcher courir rire pleurer chanter ' +
    'danser jouer lire apprendre donner prendre mettre voir venir aller faire dire ' +
    'pouvoir vouloir savoir devoir falloir valoir croire penser trouver garder laisser ' +
    'suivre ouvrir fermer commencer finir partir rester passer tourner porter lever ' +
    'poser appeler aider aimer adorer sentir toucher sentir devenir sembler rester ' +
    'vivre mourir naitre grandir changer bouger voler nager voler voler voler'
  ).split(' ');

  var ES = (
    'el la los las de del un una y en que con por para como pero este esta estos estas ' +
    'ese esa mi mis tu tus su nuestro yo el ella nosotros ellos usted me te se nos lo ' +
    'le les al ser estar tener hacer poder decir ir ver dar saber querer llegar pasar ' +
    'deber poner parecer quedar creer hablar llevar dejar seguir encontrar llamar venir ' +
    'pensar salir volver tomar conocer vivir sentir mirar contar empezar esperar buscar ' +
    'entrar trabajar escribir perder pedir recibir recordar terminar necesitar leer caer ' +
    'cambiar crear abrir ganar traer morir aceptar tiempo casa mundo hombre mujer agua ' +
    'noche puerta ciudad mano amor amigo familia trabajo palabra libro escuela pregunta ' +
    'grande bueno nuevo viejo joven largo corto alto bajo fuerte caliente frio rapido ' +
    'lento primero otro mismo cada mucho poco muy bien mal siempre nunca hoy ayer ' +
    'ahora antes entre sin sobre hasta desde porque cuando donde gracias hola adios ' +
    'favor sol luna cielo tierra fuego aire mar rio calle puerta ventana coche tren ' +
    'comer beber dormir correr reir llorar cantar bailar jugar leer aprender dar tomar ' +
    'poner ver venir ir hacer decir querer saber pensar buscar mirar escuchar hablar ' +
    'llamar quedar pasar dejar seguir creer deber poder parecer llevar traer morir ' +
    'nacer crecer cambiar mover volar nadar cantar contar empezar acabar abrir cerrar ' +
    'feliz triste joven libre claro oscuro cerca lejos dentro fuera encima debajo ' +
    'delante detrás junto entre ambos cada cual quien cuyo donde adonde ayer hoy'
  ).split(' ');

  var DE = (
    'der die das den dem des ein eine einer eines einem einen und oder aber denn doch ' +
    'nicht kein keine in im ins auf aus bei mit nach von vom zu zum zur gegen ohne um ' +
    'unter vor hinter neben zwischen durch als wie so sehr auch nur schon noch mal ja ' +
    'nein ich du er sie es wir ihr mich dich sich uns euch mein meine dein deine sein ' +
    'seine ihre unser unsere dieser diese dieses jeder jede jedes alle alles manche ' +
    'welche haben werden muss sollen wollen darf mag machen gehen kommen sehen nehmen ' +
    'geben finden stehen bleiben liegen denken wissen glauben meinen sagen sprechen ' +
    'fragen lesen schreiben lernen arbeiten spielen essen trinken schlafen wohnen kaufen ' +
    'fahren laufen singen tanzen lachen lieben hoffen warten suchen bringen zeigen ' +
    'helfen danken zeit tag jahr leben welt mann frau kind haus stadt land wasser nacht ' +
    'hand herz freund familie arbeit wort buch schule frage antwort gross klein gut ' +
    'schlecht neu alt jung lang kurz hoch stark schwach heiss kalt schnell langsam erst ' +
    'letzt viel wenig immer nie heute gestern morgen hier dort jetzt dann bald schon ' +
    'wieder oben unten links rechts warum wann wo wer was wie danke bitte hallo sonne ' +
    'mond himmel erde feuer luft meer fluss strasse auto zug essen trinken gehen sehen ' +
    'kommen geben nehmen stehen liegen heissen denken wissen sagen fragen antworten'
  ).split(' ');

  function unique(arr) {
    var seen = {}, out = [];
    for (var i = 0; i < arr.length; i++) {
      var w = (arr[i] || '').trim().toLowerCase();
      if (w && !seen[w]) { seen[w] = 1; out.push(w); }
    }
    return out;
  }

  var root = typeof globalThis !== 'undefined' ? globalThis : this;
  root.TBWords = {
    en: unique(EN),
    fr: unique(FR),
    es: unique(ES),
    de: unique(DE)
  };
})();

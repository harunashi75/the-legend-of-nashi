// @ts-check
// Dictionnaire anglais : { 'texte français': 'English text' } (voir client/i18n/i18n.js).
// {nom} : une valeur insérée (« Niveau {n} » → « Level {n} »). « contexte|texte » : un mot français à deux sens,
// demandé dans le code par tt(texte, valeurs, contexte). Un texte absent reste en français.
// Un texte composé (« · », « — », phrases) se traduit morceau par morceau : une entrée par morceau suffit.
// `node tools/i18n_strings.cjs` liste les textes qui manquent.
// Les textes sont répartis par partie du jeu dans client/i18n/en/ ; une clé n’apparaît que dans une partie.
import interfaceTexts from './en/interface.js';
import objetsClasses from './en/objets-classes.js';
import monde from './en/monde.js';
import systemes from './en/systemes.js';
import montures from './en/montures.js';
import trefonds from './en/trefonds.js';
import histoire from './en/histoire.js';
import quetes from './en/quetes.js';

export default {
  ...interfaceTexts,
  ...objetsClasses,
  ...monde,
  ...systemes,
  ...montures,
  ...trefonds,
  ...histoire,
  ...quetes
};
